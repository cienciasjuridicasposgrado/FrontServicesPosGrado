import { Injectable, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Permission } from '../../domain/models/permission.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private readonly authService = inject(AuthService);
  private readonly currentUser = toSignal(this.authService.currentUser$, { initialValue: null });
  private readonly sessionState = toSignal(this.authService.sessionState$, { initialValue: 'loading' });
  private readonly currentRole = computed(() => {
    if (this.sessionState() !== 'authenticated') {
      return null;
    }

    return this.currentUser()?.role ?? null;
  });
  has(permission: Permission): boolean {
    return this.currentRole()?.[permission] === true;
  }

  hasAll(permissions: readonly Permission[]): boolean {
    return permissions.length > 0 && permissions.every((permission) => this.has(permission));
  }

  hasAny(permissions: readonly Permission[]): boolean {
    return permissions.some((permission) => this.has(permission));
  }
}
