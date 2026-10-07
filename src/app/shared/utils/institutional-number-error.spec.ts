import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { getInstitutionalNumberError } from './institutional-number-error';

describe('institutional number errors', () => {
  it('uses the manual-number conflict copy without exposing backend internals', () => {
    const body = { message: 'QueryFailedError SQLSTATE 23505 constraint seal_number_key' };
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
    const error = new HttpErrorResponse({ status: 409 });

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
});
