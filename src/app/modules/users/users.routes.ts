import { Routes } from "@angular/router";
import { UsersListComponent } from "./components/users-list/users-list.component";
import { UserFormComponent } from "./components/user-form/user-form.component";

export const USERS_ROUTES: Routes = [
    { path: '', component: UsersListComponent},
    { path: 'new', component: UserFormComponent },
    { path: 'edit/:ci', component: UserFormComponent },
]