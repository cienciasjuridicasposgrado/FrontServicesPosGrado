
import { Routes } from '@angular/router';
import { RolesListComponent } from './components/roles-list/roles-list.component';
// import { RoleFormComponent } from './components/role-form/role-form.component'; 

export const ROLES_ROUTES: Routes = [
  { path: '', component: RolesListComponent },
  
  // Rutas para crear/editar (pendientes de implementación de formularios)
  // { path: 'new', component: RoleFormComponent },
  // { path: 'edit/:id', component: RoleFormComponent },
];