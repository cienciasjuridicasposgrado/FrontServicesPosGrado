import { TestBed } from '@angular/core/testing';
import { IdempotencyKeyFactory } from './idempotency-key.factory';

describe('IdempotencyKeyFactory', () => {
  it('creates secure UUID keys accepted by the backend contract', () => {
    const factory = TestBed.inject(IdempotencyKeyFactory);
    const first = factory.create();
    const second = factory.create();

    expect(first).toMatch(/^[A-Za-z0-9._:-]{8,128}$/);
    expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(second).not.toBe(first);
  });
});
