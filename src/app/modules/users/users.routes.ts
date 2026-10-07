import { Routes } from "@angular/router";
import { UsersListComponent } from "./components/users-list/users-list.component";
import { UserFormComponent } from "./components/user-form/user-form.component";
import { permissionGuard } from "../../core/application/guards/permission.guard";
import { PERMISSIONS } from "../../core/domain/models/permission.model";

export const USERS_ROUTES: Routes = [
    { path: '', component: UsersListComponent},
    {
        path: 'new',
        component: UserFormComponent,
        canActivate: [permissionGuard],
        data: { permissions: { allOf: [PERMISSIONS.manageUsers, PERMISSIONS.manageRoles] } }
    },
    { path: 'edit/:ci', component: UserFormComponent },
]
