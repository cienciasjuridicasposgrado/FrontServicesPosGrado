import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionRequirement } from '../../domain/models/permission.model';
import { PermissionService } from '../services/permission.service';

export const permissionGuard: CanActivateFn = (route) => {
  const requirement = route.data['permissions'] as PermissionRequirement | undefined;

  if (!requirement) {
    return true;
  }

  const permissionService = inject(PermissionService);
  const router = inject(Router);
  const satisfiesAll = requirement.allOf === undefined || permissionService.hasAll(requirement.allOf);
  const satisfiesAny = requirement.anyOf === undefined || permissionService.hasAny(requirement.anyOf);

  return satisfiesAll && satisfiesAny
    ? true
    : router.createUrlTree(['/dashboard/forbidden']);
};
