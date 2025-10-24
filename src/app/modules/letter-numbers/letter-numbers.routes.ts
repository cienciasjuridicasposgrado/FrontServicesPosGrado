import { Routes } from "@angular/router";
import { LetterNumbersListComponent } from "./components/letter-numbers-list/letter-numbers-list.component";
import { LetterNumberFormComponent } from "./components/letter-number-form/letter-number-form.component";

export const LETTER_NUMBERS_ROUTES: Routes = [
    {path: '', component: LetterNumbersListComponent},
    {path: 'create',component: LetterNumberFormComponent},
    {path: 'edit/:id',component: LetterNumberFormComponent}
]