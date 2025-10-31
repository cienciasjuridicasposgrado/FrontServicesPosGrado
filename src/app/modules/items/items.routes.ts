import { Routes } from "@angular/router";
import { ItemsListComponent } from "./components/items-list/items-list.component";
import { ItemFormComponent } from "./components/item-form/item-form.component";

export const ITEMS_ROUTES: Routes = [
    { path: '', component: ItemsListComponent },
    { path: 'new', component: ItemFormComponent },
    { path: 'edit/:codigo', component: ItemFormComponent }
]