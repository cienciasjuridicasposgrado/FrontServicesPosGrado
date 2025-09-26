import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/infrastructure/interceptors/auth.interceptor';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AuthRepository } from './core/domain/repositories/auth.repository';
import { ApiAuthRepository } from './core/infrastructure/repositories/auth/apiAuth.repository';
import { DashboardRepository } from './core/domain/repositories/dashboard.repository';
import { ApiDashboardRepository } from './core/infrastructure/repositories/dashboard/api-dashboard.repository';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideBrowserGlobalErrorListeners(),
    provideAnimations(),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: AuthRepository, useClass: ApiAuthRepository },
    { provide: DashboardRepository, useClass: ApiDashboardRepository }
  ]
};
