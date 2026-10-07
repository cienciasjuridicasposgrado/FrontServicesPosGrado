import { HttpErrorResponse } from '@angular/common/http';

const DEFAULT_STATUS_MESSAGES: Readonly<Record<number, string>> = {
    400: 'Los datos enviados no son válidos.',
    403: 'La operación fue rechazada por el servidor.',
    404: 'El registro no existe o ya fue modificado.',
    409: 'La operación entra en conflicto con el estado actual del inventario.',
    500: 'Ocurrió un error interno del servidor.'
};

function backendMessage(error: HttpErrorResponse): string | null {
    const body: unknown = error.error;

    if (typeof body === 'string' && body.trim()) {
        return body;
    }

    if (body && typeof body === 'object' && 'message' in body) {
        const message = (body as { message?: unknown }).message;
        if (typeof message === 'string' && message.trim()) {
            return message;
        }
        if (Array.isArray(message)) {
            const messages = message.filter((value): value is string => typeof value === 'string');
            if (messages.length > 0) {
                return messages.join(' ');
            }
        }
    }

    return null;
}

export function httpErrorMessage(
    error: unknown,
    fallback: string,
    statusMessages: Readonly<Partial<Record<number, string>>> = {}
): string {
    if (error instanceof HttpErrorResponse) {
        return backendMessage(error)
            ?? statusMessages[error.status]
            ?? DEFAULT_STATUS_MESSAGES[error.status]
            ?? fallback;
    }

    return error instanceof Error && error.message ? error.message : fallback;
}
