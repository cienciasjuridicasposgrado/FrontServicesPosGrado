import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { getBackendMessage, getFallbackMessage } from './http-error-message';

describe('HTTP error messages', () => {
  it('keeps a contextual backend message for a business-rule 403', () => {
    const error = new HttpErrorResponse({
      status: 403,
      error: { message: 'No se puede revertir: el stock quedaría negativo.' }
    });

    expect(getFallbackMessage(error, 'Error', { 403: 'No tiene permisos.' }))
      .toBe('No se puede revertir: el stock quedaría negativo.');
  });

  it('supports a NestJS string message', () => {
    const error = new HttpErrorResponse({
      status: 404,
      error: { message: 'Movimiento inexistente.' }
    });

    expect(getBackendMessage(error)).toBe('Movimiento inexistente.');
  });

  it('joins backend validation message arrays', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { message: ['cantidad debe ser entera', 'cantidad debe ser menor o igual a 10000'] }
    });

    expect(getFallbackMessage(error, 'Error'))
      .toBe('cantidad debe ser entera cantidad debe ser menor o igual a 10000');
  });

  it('uses the network fallback for status 0', () => {
    const error = new HttpErrorResponse({ status: 0, statusText: 'Unknown Error' });

    expect(getFallbackMessage(error, 'Error')).toContain('conectar con el servidor');
  });

  it('does not expose a stack trace or SQL details from a 500 response', () => {
    const error = new HttpErrorResponse({
      status: 500,
      error: {
        message: 'query failed: SELECT password FROM users',
        stack: 'Error: database failed\n at UsersService.findAll (users.service.ts:1:1)'
      }
    });

    const message = getFallbackMessage(error, 'No se pudo completar la operación.');
    expect(message).toBe('Ocurrió un error interno del servidor.');
    expect(message).not.toContain('SELECT');
    expect(message).not.toContain('stack');
  });

  it('does not mutate the original HttpErrorResponse', () => {
    const body = { message: 'Conflicto de versión.' };
    const headers = new HttpHeaders({ 'X-Correlation-Id': 'abc' });
    const error = new HttpErrorResponse({
      status: 409,
      error: body,
      headers,
      url: '/api/items/A'
    });

    expect(getFallbackMessage(error, 'Error')).toBe('Conflicto de versión.');
    expect(error.status).toBe(409);
    expect(error.error).toBe(body);
    expect(error.headers).toBe(headers);
    expect(error.url).toBe('/api/items/A');
  });
});
