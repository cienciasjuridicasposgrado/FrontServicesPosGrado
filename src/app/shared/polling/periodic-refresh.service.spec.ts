import { TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { POLLING_INTERVALS } from './polling-intervals';
import { PeriodicRefreshEvent, PeriodicRefreshService } from './periodic-refresh.service';

describe('PeriodicRefreshService', () => {
  let service: PeriodicRefreshService;
  let visibilityState: DocumentVisibilityState;

  beforeEach(() => {
    visibilityState = 'visible';
    spyOnProperty(document, 'visibilityState', 'get').and.callFake(() => visibilityState);
    TestBed.configureTestingModule({});
    service = TestBed.inject(PeriodicRefreshService);
  });

  afterEach(() => service.stopAll());

  it('centralizes every required module interval', () => {
    expect(POLLING_INTERVALS).toEqual({
      sealNumbers: 3000,
      letterNumbers: 3000,
      items: 5000,
      entries: 5000,
      outputs: 5000,
      dashboard: 10000,
      users: 15000,
      roles: 15000,
      departamentos: 15000
    });
  });

  it('loads immediately and refreshes at the configured interval', fakeAsync(() => {
    let calls = 0;
    const values: number[] = [];
    const handle = service.create({
      intervalMs: POLLING_INTERVALS.sealNumbers,
      request: () => of(++calls)
    });
    handle.events$.subscribe((event) => {
      if (event.type === 'success') values.push(event.data);
    });

    expect(calls).toBe(1);
    expect(values).toEqual([1]);
    tick(2999);
    expect(calls).toBe(1);
    tick(1);
    expect(calls).toBe(2);
    expect(values).toEqual([1, 2]);
  }));

  it('pauses while hidden and refreshes immediately when visible again', fakeAsync(() => {
    let calls = 0;
    const handle = service.create({ intervalMs: 3000, request: () => of(++calls) });
    handle.events$.subscribe();
    expect(calls).toBe(1);

    visibilityState = 'hidden';
    document.dispatchEvent(new Event('visibilitychange'));
    tick(12_000);
    expect(calls).toBe(1);

    visibilityState = 'visible';
    document.dispatchEvent(new Event('visibilitychange'));
    expect(calls).toBe(2);
    tick(3000);
    expect(calls).toBe(3);
  }));

  it('does not start while initially hidden', fakeAsync(() => {
    visibilityState = 'hidden';
    let calls = 0;
    const handle = service.create({ intervalMs: 3000, request: () => of(++calls) });
    handle.events$.subscribe();
    tick(9000);
    expect(calls).toBe(0);

    visibilityState = 'visible';
    document.dispatchEvent(new Event('visibilitychange'));
    expect(calls).toBe(1);
  }));

  it('deduplicates focus immediately following visibility recovery', fakeAsync(() => {
    let calls = 0;
    const handle = service.create({ intervalMs: 3000, request: () => of(++calls) });
    handle.events$.subscribe();

    visibilityState = 'hidden';
    document.dispatchEvent(new Event('visibilitychange'));
    tick(1000);
    visibilityState = 'visible';
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('focus'));
    expect(calls).toBe(2);

    tick(150);
    window.dispatchEvent(new Event('focus'));
    expect(calls).toBe(3);
  }));

  it('cancels timers when the view subscription is destroyed', fakeAsync(() => {
    let calls = 0;
    const handle = service.create({ intervalMs: 3000, request: () => of(++calls) });
    const subscription = handle.events$.subscribe();
    expect(calls).toBe(1);

    subscription.unsubscribe();
    tick(9000);
    expect(calls).toBe(1);
  }));

  it('never overlaps an identical slow request', fakeAsync(() => {
    const requests: Subject<number>[] = [];
    let activeRequests = 0;
    let maxActiveRequests = 0;
    const handle = service.create({
      intervalMs: 3000,
      request: () => {
        const request = new Subject<number>();
        requests.push(request);
        activeRequests += 1;
        maxActiveRequests = Math.max(maxActiveRequests, activeRequests);
        request.subscribe({ complete: () => activeRequests -= 1 });
        return request;
      }
    });
    handle.events$.subscribe();

    tick(9000);
    expect(requests.length).toBe(1);
    expect(maxActiveRequests).toBe(1);

    requests[0].next(1);
    requests[0].complete();
    tick(3000);
    expect(requests.length).toBe(2);
    expect(maxActiveRequests).toBe(1);
  }));

  it('coalesces a mutation refresh and discards the older response', fakeAsync(() => {
    const requests: Subject<string>[] = [];
    const values: string[] = [];
    const handle = service.create({
      intervalMs: 3000,
      request: () => {
        const request = new Subject<string>();
        requests.push(request);
        return request;
      }
    });
    handle.events$.subscribe((event) => {
      if (event.type === 'success') values.push(event.data);
    });

    handle.refreshAfterMutation();
    expect(requests.length).toBe(1);
    requests[0].next('obsolete');
    requests[0].complete();
    flushMicrotasks();
    expect(requests.length).toBe(2);
    expect(values).toEqual([]);

    requests[1].next('current');
    requests[1].complete();
    expect(values).toEqual(['current']);
  }));

  it('coalesces repeated manual refreshes behind one active request', fakeAsync(() => {
    const requests: Subject<number>[] = [];
    const handle = service.create({
      intervalMs: 3000,
      request: () => {
        const request = new Subject<number>();
        requests.push(request);
        return request;
      }
    });
    handle.events$.subscribe();

    handle.refresh();
    handle.refresh();
    handle.refresh();
    expect(requests.length).toBe(1);
    requests[0].next(1);
    requests[0].complete();
    flushMicrotasks();
    expect(requests.length).toBe(2);
  }));

  it('preserves the last successful value when a background network request fails', fakeAsync(() => {
    let calls = 0;
    const events: PeriodicRefreshEvent<string>[] = [];
    const handle = service.create({
      intervalMs: 3000,
      request: () => {
        calls += 1;
        if (calls === 2) return throwError(() => ({ status: 0 }));
        return of(`value-${calls}`);
      }
    });
    handle.events$.subscribe((event) => events.push(event));

    tick(3000);
    expect(events.length).toBe(1);
    expect(events[0].type === 'success' ? events[0].data : '').toBe('value-1');

    tick(3000);
    expect(events.length).toBe(2);
    expect(events[1].type === 'success' ? events[1].data : '').toBe('value-3');
  }));

  it('reports only the first recoverable error and applies bounded backoff', fakeAsync(() => {
    let calls = 0;
    const errors: unknown[] = [];
    const handle = service.create({
      intervalMs: 3000,
      request: () => {
        calls += 1;
        return throwError(() => ({ status: 500 }));
      }
    });
    handle.events$.subscribe((event) => {
      if (event.type === 'error') errors.push(event.error);
    });

    expect(errors.length).toBe(1);
    tick(9000);
    expect(calls).toBe(3);
    expect(errors.length).toBe(1);
  }));

  it('stops permanently after a forbidden response', fakeAsync(() => {
    let calls = 0;
    const handle = service.create({
      intervalMs: 3000,
      request: () => {
        calls += 1;
        return throwError(() => ({ status: 403 }));
      }
    });
    handle.events$.subscribe();
    tick(30_000);
    expect(calls).toBe(1);
  }));

  it('stopAll cancels active polling and ignores late responses on logout', fakeAsync(() => {
    const request = new Subject<string>();
    const values: string[] = [];
    let calls = 0;
    const handle = service.create({
      intervalMs: 3000,
      request: () => {
        calls += 1;
        return request;
      }
    });
    handle.events$.subscribe((event) => {
      if (event.type === 'success') values.push(event.data);
    });

    service.stopAll();
    request.next('previous-session');
    request.complete();
    tick(9000);
    expect(calls).toBe(1);
    expect(values).toEqual([]);
  }));
});
