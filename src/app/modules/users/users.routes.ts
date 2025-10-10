import { Routes } from "@angular/router";
import { UsersListComponent } from "./components/users-list/users-list.component";

export const USERS_ROUTES: Routes = [
    { path: '', component: UsersListComponent},
    
    // Rutas para crear/editar (pendientes de implementación de formularios)
  // { path: 'new', component: UserFormComponent },
  // { path: 'edit/:ci', component: UserFormComponent },
]