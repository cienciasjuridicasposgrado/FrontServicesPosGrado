import { HttpErrorResponse } from '@angular/common/http';
import { httpErrorMessage } from './http-error-message';

describe('httpErrorMessage', () => {
  it('uses a structured backend message before a status fallback', () => {
    const error = new HttpErrorResponse({
      status: 403,
      error: { message: 'No se puede revertir: el stock quedaría negativo.' }
    });

    expect(httpErrorMessage(error, 'Error', { 403: 'Operación rechazada.' }))
      .toBe('No se puede revertir: el stock quedaría negativo.');
  });

  it('provides contextual status messages when the backend has no message', () => {
    const error = new HttpErrorResponse({ status: 409, error: {} });

    expect(httpErrorMessage(error, 'Error'))
      .toContain('conflicto');
  });

  it('joins backend validation message arrays', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { message: ['cantidad debe ser entera', 'cantidad debe ser menor o igual a 10000'] }
    });

    expect(httpErrorMessage(error, 'Error'))
      .toBe('cantidad debe ser entera cantidad debe ser menor o igual a 10000');
  });
});
