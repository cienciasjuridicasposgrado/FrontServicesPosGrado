import { Routes } from "@angular/router";
import { ItemsListComponent } from "./components/items-list/items-list.component";
import { ItemFormComponent } from "./components/item-form/item-form.component";
import { permissionGuard } from "../../core/application/guards/permission.guard";
import { PERMISSIONS } from "../../core/domain/models/permission.model";

export const ITEMS_ROUTES: Routes = [
    { path: '', component: ItemsListComponent },
    {
        path: 'new',
        component: ItemFormComponent,
        canActivate: [permissionGuard],
        data: { permissions: { allOf: [PERMISSIONS.manageCatalog] } }
    },
    {
        path: 'edit/:codigo',
        component: ItemFormComponent,
        canActivate: [permissionGuard],
        data: { permissions: { allOf: [PERMISSIONS.manageCatalog] } }
    }
]
