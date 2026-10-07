import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Inject, Injectable, NgZone, OnDestroy } from '@angular/core';
import {
  Observable,
  Subject,
  Subscription,
  defer,
  distinctUntilChanged,
  filter,
  from,
  fromEvent,
  interval,
  isObservable,
  map,
  startWith,
  take
} from 'rxjs';

export type RefreshCause = 'initial' | 'interval' | 'resume' | 'focus' | 'manual' | 'mutation';

export type PeriodicRefreshEvent<T> =
  | {
      type: 'success';
      data: T;
      cause: RefreshCause;
      initial: boolean;
    }
  | {
      type: 'error';
      error: unknown;
      cause: RefreshCause;
      initial: boolean;
      terminal: boolean;
    };

export interface PeriodicRefreshOptions<T> {
  intervalMs: number;
  request: () => Promise<T> | Observable<T>;
  maxBackoffMs?: number;
}

export interface PeriodicRefreshHandle<T> {
  readonly events$: Observable<PeriodicRefreshEvent<T>>;
  refresh(): void;
  refreshAfterMutation(): void;
  stop(): void;
}

interface ManagedHandle {
  stop(): void;
}

const RESUME_DEDUPLICATION_MS = 150;
const DEFAULT_MAX_BACKOFF_MS = 30_000;

@Injectable({ providedIn: 'root' })
export class PeriodicRefreshService implements OnDestroy {
  private readonly handles = new Set<ManagedHandle>();

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly ngZone: NgZone
  ) {}

  create<T>(options: PeriodicRefreshOptions<T>): PeriodicRefreshHandle<T> {
    const manualTriggers = new Subject<RefreshCause>();
    const mutationTriggers = new Subject<void>();
    const stopSignal = new Subject<void>();
    let stopped = false;
    let handle!: PeriodicRefreshHandle<T>;

    const events$ = new Observable<PeriodicRefreshEvent<T>>((observer) => {
      if (stopped) {
        observer.complete();
        return undefined;
      }

      return this.ngZone.runOutsideAngular(() => {

      let active = true;
      let inFlight = false;
      let initialSettled = false;
      let mutationRevision = 0;
      let queuedCause: RefreshCause | null = null;
      let consecutiveFailures = 0;
      let nextAllowedAt = 0;
      let lastResumeAt = Number.NEGATIVE_INFINITY;
      let hasBeenVisible = false;
      let periodicSubscription: Subscription | null = null;
      let requestSubscription: Subscription | null = null;
      const subscriptions = new Subscription();

      const isVisible = (): boolean => this.document.visibilityState !== 'hidden';

      const queue = (cause: RefreshCause): void => {
        if (cause === 'interval') return;
        if (cause === 'mutation' || queuedCause === null) queuedCause = cause;
      };

      const finishRequest = (): void => {
        inFlight = false;
        requestSubscription = null;

        if (!active || !queuedCause || !isVisible()) return;

        const nextCause = queuedCause;
        queuedCause = null;
        Promise.resolve().then(() => trigger(nextCause));
      };

      const stopController = (): void => {
        if (!active) return;
        active = false;
        stopped = true;
        periodicSubscription?.unsubscribe();
        requestSubscription?.unsubscribe();
        subscriptions.unsubscribe();
        this.ngZone.run(() => observer.complete());
        this.handles.delete(handle);
      };

      const trigger = (cause: RefreshCause): void => {
        if (!active) return;

        if (!isVisible()) {
          queue(cause);
          return;
        }

        if (inFlight) {
          queue(cause);
          return;
        }

        const bypassBackoff = cause === 'manual' || cause === 'mutation';
        if (!bypassBackoff && Date.now() < nextAllowedAt) return;

        inFlight = true;
        const requestRevision = mutationRevision;
        const request$ = defer(() => {
          const result = options.request();
          return isObservable(result) ? result : from(result);
        }).pipe(take(1));

        requestSubscription = request$.subscribe({
          next: (data) => {
            consecutiveFailures = 0;
            nextAllowedAt = 0;
            const initial = !initialSettled;
            initialSettled = true;

            if (active && requestRevision === mutationRevision) {
                this.ngZone.run(() => observer.next({ type: 'success', data, cause, initial }));
            }
          },
          error: (error: unknown) => {
            consecutiveFailures += 1;
            const backoffMs = Math.min(
              options.intervalMs * 2 ** (consecutiveFailures - 1),
              options.maxBackoffMs ?? DEFAULT_MAX_BACKOFF_MS
            );
            nextAllowedAt = Date.now() + backoffMs;

            const initial = !initialSettled;
            initialSettled = true;
            const status = this.getHttpStatus(error);
            const terminal = status === 401 || status === 403;

            if (active && (initial || terminal)) {
              this.ngZone.run(() => observer.next({ type: 'error', error, cause, initial, terminal }));
            }

            finishRequest();
            if (terminal) stopController();
          },
          complete: finishRequest
        });
      };

      subscriptions.add(manualTriggers.subscribe((cause) => trigger(cause)));
      subscriptions.add(mutationTriggers.subscribe(() => {
        mutationRevision += 1;
        trigger('mutation');
      }));
      subscriptions.add(stopSignal.subscribe(stopController));

      const visibility$ = fromEvent(this.document, 'visibilitychange').pipe(
        map(() => isVisible()),
        startWith(isVisible()),
        distinctUntilChanged()
      );

      subscriptions.add(visibility$.subscribe((visible) => {
        periodicSubscription?.unsubscribe();
        periodicSubscription = null;

        if (!visible) return;

        lastResumeAt = Date.now();
        const pendingCause = queuedCause;
        queuedCause = null;
        const cause: RefreshCause = pendingCause === 'mutation'
          ? 'mutation'
          : hasBeenVisible
            ? 'resume'
            : 'initial';
        hasBeenVisible = true;
        trigger(cause);

        periodicSubscription = interval(options.intervalMs).subscribe(() => trigger('interval'));
      }));

      const window = this.document.defaultView;
      if (window) {
        subscriptions.add(fromEvent(window, 'focus').pipe(
          filter(() => isVisible()),
          filter(() => Date.now() - lastResumeAt >= RESUME_DEDUPLICATION_MS)
        ).subscribe(() => {
          lastResumeAt = Date.now();
          trigger('focus');
        }));
      }

        return stopController;
      });
    });

    handle = {
      events$,
      refresh: () => {
        if (!stopped) manualTriggers.next('manual');
      },
      refreshAfterMutation: () => {
        if (!stopped) mutationTriggers.next();
      },
      stop: () => {
        if (stopped) return;
        stopped = true;
        stopSignal.next();
        stopSignal.complete();
        manualTriggers.complete();
        mutationTriggers.complete();
        this.handles.delete(handle);
      }
    };

    this.handles.add(handle);
    return handle;
  }

  stopAll(): void {
    for (const handle of [...this.handles]) handle.stop();
  }

  ngOnDestroy(): void {
    this.stopAll();
  }

  private getHttpStatus(error: unknown): number | undefined {
    if (error instanceof HttpErrorResponse) return error.status;
    if (typeof error !== 'object' || error === null || !('status' in error)) return undefined;
    return typeof error.status === 'number' ? error.status : undefined;
  }
}
