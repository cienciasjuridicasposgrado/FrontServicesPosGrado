import { HttpErrorResponse } from '@angular/common/http';

const DEFAULT_STATUS_MESSAGES: Readonly<Record<number, string>> = {
  0: 'No se pudo conectar con el servidor. Verifique su conexión e intente nuevamente.',
  400: 'Los datos enviados no son válidos.',
  401: 'La sesión no es válida o ha expirado.',
  403: 'La operación fue rechazada por el servidor.',
  404: 'El registro no existe o ya fue modificado.',
  409: 'La operación entra en conflicto con el estado actual.',
  500: 'Ocurrió un error interno del servidor.'
};

function normalizeMessage(value: unknown): string | null {
  if (typeof value === 'string') {
    const message = value.trim();
    return message || null;
  }

  if (Array.isArray(value)) {
    const messages = value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
    return messages.length > 0 ? messages.join(' ') : null;
  }

  return null;
}

/**
 * Extracts user-facing messages from the usual NestJS response shape.
 * Server and network failures are deliberately excluded so accidental stack
 * traces, SQL or infrastructure details never reach the UI.
 */
export function getBackendMessage(error: unknown): string | null {
  if (!(error instanceof HttpErrorResponse) || error.status === 0 || error.status >= 500) {
    return null;
  }

  const body: unknown = error.error;
  const directMessage = normalizeMessage(body);
  if (directMessage) return directMessage;

  if (body && typeof body === 'object' && 'message' in body) {
    return normalizeMessage((body as { message?: unknown }).message);
  }

  return null;
}

export function getFallbackMessage(
  error: unknown,
  fallback: string,
  statusMessages: Readonly<Partial<Record<number, string>>> = {}
): string {
  if (error instanceof HttpErrorResponse) {
    return getBackendMessage(error)
      ?? statusMessages[error.status]
      ?? DEFAULT_STATUS_MESSAGES[error.status]
      ?? fallback;
  }

  return error instanceof Error && error.message ? error.message : fallback;
}
