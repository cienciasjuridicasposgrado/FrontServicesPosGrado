import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AUTH_TOKEN_STORAGE_KEY } from '../../application/auth.constants';
import { AuthService } from '../../application/services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const isLoginRequest = req.method === 'POST' && /\/auth\/login\/?(?:\?|$)/.test(req.url);
  const accessToken = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)?.trim();

  const authenticatedRequest = !isLoginRequest && accessToken
    ? req.clone({
        headers: req.headers.set('Authorization', `Bearer ${accessToken}`)
      })
    : req;

  return next(authenticatedRequest).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && !isLoginRequest) {
        const currentAccessToken = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)?.trim();
        const requestCredentialIsCurrent = accessToken
          ? currentAccessToken === accessToken
          : !currentAccessToken;

        if (requestCredentialIsCurrent) {
          authService.handleUnauthorized(router.url);
        }
      }

      return throwError(() => error);
    })
  );
};
