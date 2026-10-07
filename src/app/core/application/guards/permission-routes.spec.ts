import { Route } from '@angular/router';
import { DASHBOARD_ROUTES } from '../../../modules/dashboard/dashboard.routes';
import { ENTRIES_ROUTES, OUTPUTS_ROUTES } from '../../../modules/inventory/inventory.routes';
import { ITEMS_ROUTES } from '../../../modules/items/items.routes';
import { USERS_ROUTES } from '../../../modules/users/users.routes';
import { Permission, PermissionRequirement, PERMISSIONS } from '../../domain/models/permission.model';
import { permissionGuard } from './permission.guard';

describe('permission route matrix', () => {
  const dashboardChildren = DASHBOARD_ROUTES[0].children ?? [];

  function find(routes: Route[], path: string): Route {
    const route = routes.find((candidate) => candidate.path === path);
    if (!route) {
      throw new Error(`Route not found: ${path}`);
    }
    return route;
  }

  function requirement(route: Route): PermissionRequirement | undefined {
    return route.data?.['permissions'] as PermissionRequirement | undefined;
  }

  function allows(route: Route, granted: readonly Permission[]): boolean {
    const permissions = requirement(route);
    if (!permissions) return true;

    const all = permissions.allOf === undefined || permissions.allOf.every((item) => granted.includes(item));
    const any = permissions.anyOf === undefined || permissions.anyOf.some((item) => granted.includes(item));
    return all && any;
  }

  it('blocks Roles without canManageRoles', () => {
    const route = find(dashboardChildren, 'roles');

    expect(route.canActivate).toContain(permissionGuard);
    expect(allows(route, [])).toBeFalse();
    expect(allows(route, [PERMISSIONS.manageRoles])).toBeTrue();
  });

  it('allows the Users section with canManageUsers', () => {
    const route = find(dashboardChildren, 'users');

    expect(allows(route, [PERMISSIONS.manageUsers])).toBeTrue();
  });

  it('requires both user-management permissions to create a user', () => {
    const route = find(USERS_ROUTES, 'new');

    expect(allows(route, [PERMISSIONS.manageUsers])).toBeFalse();
    expect(allows(route, [PERMISSIONS.manageRoles])).toBeFalse();
    expect(allows(route, [PERMISSIONS.manageUsers, PERMISSIONS.manageRoles])).toBeTrue();
  });

  it('keeps the Items list open and protects create/edit with canManageCatalog', () => {
    expect(allows(find(ITEMS_ROUTES, ''), [])).toBeTrue();
    expect(allows(find(ITEMS_ROUTES, 'new'), [])).toBeFalse();
    expect(allows(find(ITEMS_ROUTES, 'edit/:codigo'), [])).toBeFalse();
    expect(allows(find(ITEMS_ROUTES, 'new'), [PERMISSIONS.manageCatalog])).toBeTrue();
  });

  it('keeps the Entries list open and protects create with canMakeEntry', () => {
    expect(allows(find(ENTRIES_ROUTES, ''), [])).toBeTrue();
    expect(allows(find(ENTRIES_ROUTES, 'new'), [])).toBeFalse();
    expect(allows(find(ENTRIES_ROUTES, 'new'), [PERMISSIONS.makeEntry])).toBeTrue();
  });

  it('keeps the Outputs list open and protects create/edit with canMakeOutput', () => {
    expect(allows(find(OUTPUTS_ROUTES, ''), [])).toBeTrue();
    expect(allows(find(OUTPUTS_ROUTES, 'new'), [])).toBeFalse();
    expect(allows(find(OUTPUTS_ROUTES, 'edit/:id'), [])).toBeFalse();
    expect(allows(find(OUTPUTS_ROUTES, 'new'), [PERMISSIONS.makeOutput])).toBeTrue();
  });
});
