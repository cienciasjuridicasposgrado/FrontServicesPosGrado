import { createCreationAttempt } from './creation-attempt';

describe('createCreationAttempt', () => {
  it('keeps a frozen snapshot independent from later form-object changes', () => {
    const formValue = { user_ci: 123, observacion: 'Original' };
    const attempt = createCreationAttempt('letter-number', 'operation-0001', formValue, 900);

    formValue.observacion = 'Modificada';

    expect(attempt.payload).toEqual({ user_ci: 123, observacion: 'Original' });
    expect(Object.isFrozen(attempt.payload)).toBeTrue();
    expect(attempt.state).toBe('new');
    expect(attempt.actorCi).toBe(900);
  });
});
