import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import {
  getInstitutionalNumberConflictCode,
  getInstitutionalNumberError,
  isUncertainCreationError
} from './institutional-number-error';

describe('institutional number errors', () => {
  it('uses the manual-number conflict copy without exposing backend internals', () => {
    const body = {
      code: 'INSTITUTIONAL_NUMBER_CONFLICT',
      message: 'QueryFailedError SQLSTATE 23505 constraint seal_number_key'
    };
    const headers = new HttpHeaders({ 'X-Correlation-Id': 'conflict-1' });
    const error = new HttpErrorResponse({ status: 409, error: body, headers });

    const result = getInstitutionalNumberError(error, true, 'Error');

    expect(result).toEqual({
      title: 'Número ya asignado',
      message: 'Este número ya fue utilizado o reservado. Verifica el número e intenta nuevamente con otro.'
    });
    expect(result.message).not.toContain('SQLSTATE');
    expect(error.error).toBe(body);
    expect(error.headers).toBe(headers);
    expect(error.status).toBe(409);
  });

  it('uses the automatic-number conflict copy', () => {
    const error = new HttpErrorResponse({
      status: 409,
      error: { code: 'INSTITUTIONAL_NUMBER_CONFLICT' }
    });

    expect(getInstitutionalNumberError(error, false, 'Error')).toEqual({
      title: 'No se pudo asignar el número',
      message: 'El número solicitado ya no está disponible. Puedes intentar generar uno nuevo.'
    });
  });

  it('treats status 0 as an uncertain result instead of a confirmed failure', () => {
    const error = new HttpErrorResponse({ status: 0 });

    expect(getInstitutionalNumberError(error, false, 'Error')).toEqual({
      title: 'Resultado no confirmado',
      message: 'No pudimos confirmar si la operación se completó. Revisa el listado antes de intentar nuevamente para evitar registros duplicados.'
    });
  });

  it('keeps the existing status-specific handling for other HTTP errors', () => {
    const error = new HttpErrorResponse({ status: 403 });

    expect(getInstitutionalNumberError(error, false, 'Error')).toEqual({
      title: 'No se pudo guardar',
      message: 'La operación fue rechazada por el servidor.'
    });
  });

  it('reads the documented top-level Nest conflict code and not arbitrary messages', () => {
    const known = new HttpErrorResponse({
      status: 409,
      error: { statusCode: 409, code: 'IDEMPOTENCY_RESULT_GONE', message: 'Gone' }
    });
    const unknown = new HttpErrorResponse({
      status: 409,
      error: { message: 'IDEMPOTENCY_RESULT_GONE' }
    });

    expect(getInstitutionalNumberConflictCode(known)).toBe('IDEMPOTENCY_RESULT_GONE');
    expect(getInstitutionalNumberConflictCode(unknown)).toBeNull();
    expect(getInstitutionalNumberError(unknown, false, 'Error')).toEqual({
      title: 'Conflicto al guardar',
      message: 'La operación entra en conflicto con el estado actual. Revisa la información antes de continuar.'
    });
  });

  it('classifies 5xx and timeout failures as uncertain without exposing server details', () => {
    for (const status of [500, 502, 503, 504]) {
      const error = new HttpErrorResponse({ status, error: { message: 'SQL internal detail' } });
      expect(isUncertainCreationError(error)).toBeTrue();
      expect(getInstitutionalNumberError(error, false, 'Error', true).title).toBe('Resultado no confirmado');
      expect(getInstitutionalNumberError(error, false, 'Error', true).message).not.toContain('SQL');
    }

    const timeout = new Error('internal timeout');
    timeout.name = 'TimeoutError';
    expect(isUncertainCreationError(timeout)).toBeTrue();
  });

  it('does not change the existing 5xx copy for non-creation operations', () => {
    const error = new HttpErrorResponse({ status: 500, error: { message: 'SQL internal detail' } });

    expect(getInstitutionalNumberError(error, false, 'No se pudo actualizar.')).toEqual({
      title: 'No se pudo guardar',
      message: 'Ocurrió un error interno del servidor.'
    });
  });
});
