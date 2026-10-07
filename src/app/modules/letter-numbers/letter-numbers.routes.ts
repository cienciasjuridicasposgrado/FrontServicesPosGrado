import { Routes } from "@angular/router";
import { LetterNumbersListComponent } from "./components/letter-numbers-list/letter-numbers-list.component";
import { LetterNumberFormComponent } from "./components/letter-number-form/letter-number-form.component";
import { permissionGuard } from "../../core/application/guards/permission.guard";
import { PERMISSIONS } from "../../core/domain/models/permission.model";

export const LETTER_NUMBERS_ROUTES: Routes = [
    {path: '', component: LetterNumbersListComponent},
    {
        path: 'create',
        component: LetterNumberFormComponent,
        canActivate: [permissionGuard],
        data: { permissions: { allOf: [PERMISSIONS.generateLetters] } }
    },
    {
        path: 'edit/:id',
        component: LetterNumberFormComponent,
        canActivate: [permissionGuard],
        data: { permissions: { allOf: [PERMISSIONS.generateLetters] } }
    }
]
