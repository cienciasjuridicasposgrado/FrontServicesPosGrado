import { inject } from '@angular/core';
import { CanMatchFn, Router, UrlSegment } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanMatchFn = (_route, segments) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.initializeSession().pipe(
    map((state) => {
      if (state === 'authenticated') {
        return true;
      }

      const returnUrl = buildReturnUrl(segments);
      return router.createUrlTree(['/auth/login'], {
        queryParams: returnUrl ? { returnUrl } : undefined
      });
    })
  );
};

function buildReturnUrl(segments: UrlSegment[]): string | undefined {
  const path = segments.map((segment) => segment.path).filter(Boolean).join('/');
  return path ? `/${path}` : undefined;
}
