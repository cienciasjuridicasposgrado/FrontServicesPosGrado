import { Routes } from '@angular/router';
import { SealNumbersListComponent } from './components/seal-numbers-list/seal-numbers-list.component';
import { SealNumberFormComponent } from './components/seal-number-form/seal-number-form.component';
import { permissionGuard } from '../../core/application/guards/permission.guard';
import { PERMISSIONS } from '../../core/domain/models/permission.model';

export const SEAL_NUMBERS_ROUTES: Routes = [
  {path: '', component: SealNumbersListComponent},
  {
    path: 'create',
    component: SealNumberFormComponent,
    canActivate: [permissionGuard],
    data: { permissions: { allOf: [PERMISSIONS.generateSeals] } }
  },
  {
    path: 'edit/:id',
    component: SealNumberFormComponent,
    canActivate: [permissionGuard],
    data: { permissions: { allOf: [PERMISSIONS.generateSeals] } }
  }
];
