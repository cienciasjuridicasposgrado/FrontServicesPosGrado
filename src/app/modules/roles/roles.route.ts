
import { Routes } from '@angular/router';
import { RolesListComponent } from './components/roles-list/roles-list.component';
import { RoleFormComponent } from './components/roles-form/role-form.component';

export const ROLES_ROUTES: Routes = [
  { path: '', component: RolesListComponent },
  { path: 'new', component: RoleFormComponent },
  { path: 'edit/:id', component: RoleFormComponent },
];