import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class IdempotencySessionService {
  private readonly invalidatedSubject = new Subject<void>();
  private generation = 0;

  readonly invalidated$ = this.invalidatedSubject.asObservable();

  get currentGeneration(): number {
    return this.generation;
  }

  invalidatePendingAttempts(): void {
    this.generation += 1;
    this.invalidatedSubject.next();
  }
}
