import { Routes } from '@angular/router';
import { DepartamentosListComponent } from './components/departamentos-list/departamentos-list.component';
import { DepartamentoFormComponent } from './components/departamento-form/departamento-form.component';
import { permissionGuard } from '../../core/application/guards/permission.guard';
import { PERMISSIONS } from '../../core/domain/models/permission.model';

export const DEPARTAMENTOS_ROUTES: Routes = [
    { path: '', component: DepartamentosListComponent },    
    {
        path: 'new',
        component: DepartamentoFormComponent,
        canActivate: [permissionGuard],
        data: { permissions: { allOf: [PERMISSIONS.manageCatalog] } }
    },
    {
        path: 'edit/:id',
        component: DepartamentoFormComponent,
        canActivate: [permissionGuard],
        data: { permissions: { allOf: [PERMISSIONS.manageCatalog] } }
    },
];
