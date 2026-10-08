import { HttpErrorResponse } from '@angular/common/http';
import { getFallbackMessage } from './http-error-message';

export interface InstitutionalNumberErrorMessage {
  title: string;
  message: string;
}

export type InstitutionalNumberConflictCode =
  | 'INSTITUTIONAL_NUMBER_CONFLICT'
  | 'IDEMPOTENCY_KEY_REUSED'
  | 'IDEMPOTENCY_RESULT_GONE'
  | 'IDEMPOTENCY_RESULT_CHANGED';

const MANUAL_CONFLICT: InstitutionalNumberErrorMessage = {
  title: 'Número ya asignado',
  message: 'Este número ya fue utilizado o reservado. Verifica el número e intenta nuevamente con otro.'
};

const AUTOMATIC_CONFLICT: InstitutionalNumberErrorMessage = {
  title: 'No se pudo asignar el número',
  message: 'El número solicitado ya no está disponible. Puedes intentar generar uno nuevo.'
};

const UNCERTAIN_RESULT: InstitutionalNumberErrorMessage = {
  title: 'Resultado no confirmado',
  message: 'No pudimos confirmar si la operación se completó. Revisa el listado antes de intentar nuevamente para evitar registros duplicados.'
};

const IDEMPOTENCY_ERRORS: Record<
  Exclude<InstitutionalNumberConflictCode, 'INSTITUTIONAL_NUMBER_CONFLICT'>,
  InstitutionalNumberErrorMessage
> = {
  IDEMPOTENCY_KEY_REUSED: {
    title: 'Operación registrada con otros datos',
    message: 'Esta operación ya fue registrada con datos diferentes. Revisa la información antes de iniciar una nueva generación.'
  },
  IDEMPOTENCY_RESULT_GONE: {
    title: 'Documento eliminado',
    message: 'Esta operación ya fue procesada, pero el documento generado posteriormente fue eliminado. No se realizará otra generación automática.'
  },
  IDEMPOTENCY_RESULT_CHANGED: {
    title: 'Documento modificado',
    message: 'La operación original ya fue procesada, pero el documento cambió posteriormente. Revisa su estado actual.'
  }
};

const KNOWN_CONFLICT_CODES = new Set<InstitutionalNumberConflictCode>([
  'INSTITUTIONAL_NUMBER_CONFLICT',
  'IDEMPOTENCY_KEY_REUSED',
  'IDEMPOTENCY_RESULT_GONE',
  'IDEMPOTENCY_RESULT_CHANGED'
]);

export function getInstitutionalNumberConflictCode(
  error: unknown
): InstitutionalNumberConflictCode | null {
  if (!(error instanceof HttpErrorResponse) || error.status !== 409) {
    return null;
  }

  const body = error.error as { code?: unknown } | null;
  const code = body?.code;

  return typeof code === 'string' && KNOWN_CONFLICT_CODES.has(code as InstitutionalNumberConflictCode)
    ? code as InstitutionalNumberConflictCode
    : null;
}

export function isUncertainCreationError(error: unknown): boolean {
  if (error instanceof HttpErrorResponse) {
    return error.status === 0 || [500, 502, 503, 504].includes(error.status);
  }

  return error instanceof Error && error.name === 'TimeoutError';
}

export function getInstitutionalNumberError(
  error: unknown,
  manualNumberRequested: boolean,
  fallback: string,
  treatServerErrorAsUncertain = false
): InstitutionalNumberErrorMessage {
  const conflictCode = getInstitutionalNumberConflictCode(error);

  if (conflictCode === 'INSTITUTIONAL_NUMBER_CONFLICT') {
    return manualNumberRequested ? MANUAL_CONFLICT : AUTOMATIC_CONFLICT;
  }

  if (conflictCode) {
    return IDEMPOTENCY_ERRORS[conflictCode];
  }

  if ((error instanceof HttpErrorResponse && error.status === 0) ||
    (treatServerErrorAsUncertain && isUncertainCreationError(error))) {
    return UNCERTAIN_RESULT;
  }

  if (error instanceof HttpErrorResponse && error.status === 409) {
    return {
      title: 'Conflicto al guardar',
      message: 'La operación entra en conflicto con el estado actual. Revisa la información antes de continuar.'
    };
  }

  return {
    title: 'No se pudo guardar',
    message: getFallbackMessage(error, fallback)
  };
}
