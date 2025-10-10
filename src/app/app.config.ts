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
import { LoginUseCase } from './core/application/usecase/auth/login.usecase';
import { GetProfileUseCase } from './core/application/usecase/auth/profile.usecase';
import { RolesRepository } from './core/domain/repositories/roles.repository';
import { RolesHttpRepository } from './core/infrastructure/repositories/roles/roles-http.repository';
import { DepartamentosRepository } from './core/domain/repositories/departamentos.repository';
import { ItemsRepository } from './core/domain/repositories/items.repository';
import { UsersRepository } from './core/domain/repositories/users.repository';
import { DepartamentosHttpRepository } from './core/infrastructure/repositories/departamentos/departamentos-http.repository';
import { ItemsHttpRepository } from './core/infrastructure/repositories/items/items-http.repository';
import { UsersHttpRepository } from './core/infrastructure/repositories/users/users-http.repository';
import { InventoryEntriesRepository } from './core/domain/repositories/inventory-entries.repository';
import { InventoryOutputsRepository } from './core/domain/repositories/inventory-outputs.repository';
import { InventoryEntriesHttpRepository } from './core/infrastructure/repositories/inventory-entries/inventory-entries-http.repository';
import { InventoryOutputsHttpRepository } from './core/infrastructure/repositories/inventory-outputs/invnetory-outputs-http.repository';
import { LogoutUseCase } from './core/application/usecase/auth/logout.usecase';
import { GetStatsUseCase } from './core/application/usecase/dashboard/get-stats.usecase';
import { GetRecentActivitiesUseCase } from './core/application/usecase/dashboard/get-recent-activities.usecase';
import { NotificationService } from './shared/services/notification.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    NotificationService,
    provideBrowserGlobalErrorListeners(),
    provideAnimations(),
    provideHttpClient(withInterceptors([authInterceptor])),
    
    // --- Mapeo de Repositorios (Auth y Dashboard) ---
    { provide: AuthRepository, useClass: ApiAuthRepository },
    { provide: DashboardRepository, useClass: ApiDashboardRepository },

    // --- Mapeo de Repositorios (Entidades Maestras) ---
    { provide: RolesRepository, useClass: RolesHttpRepository },
    { provide: UsersRepository, useClass: UsersHttpRepository },
    { provide: DepartamentosRepository, useClass: DepartamentosHttpRepository },
    { provide: ItemsRepository, useClass: ItemsHttpRepository },

    // --- Mapeo de Repositorios (Entidades Transaccionales) ---
    { provide: InventoryEntriesRepository, useClass: InventoryEntriesHttpRepository },
    { provide: InventoryOutputsRepository, useClass: InventoryOutputsHttpRepository },

    LoginUseCase,
    GetProfileUseCase,
    LogoutUseCase,
    GetStatsUseCase,
    GetRecentActivitiesUseCase
  ]
};
