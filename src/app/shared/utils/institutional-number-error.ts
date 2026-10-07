import { HttpErrorResponse } from '@angular/common/http';
import { getFallbackMessage } from './http-error-message';

export interface InstitutionalNumberErrorMessage {
  title: string;
  message: string;
}

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

export function getInstitutionalNumberError(
  error: unknown,
  manualNumberRequested: boolean,
  fallback: string
): InstitutionalNumberErrorMessage {
  if (error instanceof HttpErrorResponse && error.status === 409) {
    return manualNumberRequested ? MANUAL_CONFLICT : AUTOMATIC_CONFLICT;
  }

  if (error instanceof HttpErrorResponse && error.status === 0) {
    return UNCERTAIN_RESULT;
  }

  return {
    title: 'No se pudo guardar',
    message: getFallbackMessage(error, fallback)
  };
}
