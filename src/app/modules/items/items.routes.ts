import { Routes } from "@angular/router";
import { ItemsListComponent } from "./components/items-list/items-list.component";
import { ItemFormComponent } from "./components/item-form/item-form.component";
import { permissionGuard } from "../../core/application/guards/permission.guard";
import { PERMISSIONS } from "../../core/domain/models/permission.model";
import { ItemImportComponent } from "./components/item-import/item-import.component";

export const ITEMS_ROUTES: Routes = [
    { path: '', component: ItemsListComponent },
    {
        path: 'new',
        component: ItemFormComponent,
        canActivate: [permissionGuard],
        data: { permissions: { allOf: [PERMISSIONS.manageCatalog] } }
    },
    {
        path: 'import',
        component: ItemImportComponent,
        canActivate: [permissionGuard],
        data: {
            permissions: {
                allOf: [PERMISSIONS.manageCatalog, PERMISSIONS.makeEntry]
            }
        }
    },
    {
        path: 'edit/:codigo',
        component: ItemFormComponent,
        canActivate: [permissionGuard],
        data: { permissions: { allOf: [PERMISSIONS.manageCatalog] } }
    }
]
