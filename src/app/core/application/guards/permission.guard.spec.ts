import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { PERMISSIONS, PermissionRequirement } from '../../domain/models/permission.model';
import { PermissionService } from '../services/permission.service';
import { permissionGuard } from './permission.guard';

describe('permissionGuard', () => {
  let router: Router;
  let permissionService: jasmine.SpyObj<PermissionService>;

  beforeEach(() => {
    permissionService = jasmine.createSpyObj<PermissionService>('PermissionService', ['hasAll', 'hasAny']);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: PermissionService, useValue: permissionService }
      ]
    });
    router = TestBed.inject(Router);
    permissionService.hasAll.and.returnValue(true);
    permissionService.hasAny.and.returnValue(true);
  });

  function runGuard(permissions?: PermissionRequirement): boolean | UrlTree {
    const route = { data: permissions ? { permissions } : {} } as ActivatedRouteSnapshot;
    return TestBed.runInInjectionContext(() =>
      permissionGuard(route, {} as RouterStateSnapshot) as boolean | UrlTree
    );
  }

  it('allows a route without permission metadata', () => {
    expect(runGuard()).toBeTrue();
    expect(permissionService.hasAll).not.toHaveBeenCalled();
  });

  it('allows allOf with one granted permission', () => {
    expect(runGuard({ allOf: [PERMISSIONS.manageUsers] })).toBeTrue();
    expect(permissionService.hasAll).toHaveBeenCalledWith([PERMISSIONS.manageUsers]);
  });

  it('allows allOf with two granted permissions', () => {
    expect(runGuard({ allOf: [PERMISSIONS.manageUsers, PERMISSIONS.manageRoles] })).toBeTrue();
  });

  it('blocks allOf when one permission is missing', () => {
    permissionService.hasAll.and.returnValue(false);

    const result = runGuard({ allOf: [PERMISSIONS.manageUsers, PERMISSIONS.manageRoles] });

    expect(router.serializeUrl(result as UrlTree)).toBe('/dashboard/forbidden');
  });

  it('blocks an authenticated session without a role through fail-closed service semantics', () => {
    permissionService.hasAll.and.returnValue(false);

    const result = runGuard({ allOf: [PERMISSIONS.manageUsers] });

    expect(router.serializeUrl(result as UrlTree)).toBe('/dashboard/forbidden');
  });

  it('supports anyOf and does not redirect a permission failure to login', () => {
    permissionService.hasAny.and.returnValue(false);

    const result = runGuard({ anyOf: [PERMISSIONS.makeEntry, PERMISSIONS.makeOutput] });

    expect(router.serializeUrl(result as UrlTree)).toBe('/dashboard/forbidden');
    expect(router.serializeUrl(result as UrlTree)).not.toContain('/auth/login');
  });
});
