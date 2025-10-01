import { CommonModule } from "@angular/common";
import { HttpClientModule } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { RolesRepository } from "./domain/repositories/roles.repository";
import { RolesHttpRepository } from "./infrastructure/repositories/roles/roles-http.repository";
import { UsersRepository } from "./domain/repositories/users.repository";
import { UsersHttpRepository } from "./infrastructure/repositories/users/users-http.repository";
import { DepartamentosRepository } from "./domain/repositories/departamentos.repository";
import { DepartamentosHttpRepository } from "./infrastructure/repositories/departamentos/departamentos-http.repository";
import { ItemsRepository } from "./domain/repositories/items.repository";
import { ItemsHttpRepository } from "./infrastructure/repositories/items/items-http.repository";
import { InventoryEntriesRepository } from "./domain/repositories/inventory-entries.repository";
import { InventoryEntriesHttpRepository } from "./infrastructure/repositories/inventory-entries/inventory-entries-http.repository";

@NgModule({
    declarations: [],
    imports: [
        CommonModule,
        HttpClientModule
    ],
    providers: [
        {
            provide: RolesRepository,
            useClass: RolesHttpRepository
        },
        {
            provide: UsersRepository,
            useClass: UsersHttpRepository
        },
        {
            provide: DepartamentosRepository,
            useClass: DepartamentosHttpRepository
        },
        {
            provide: ItemsRepository,
            useClass: ItemsHttpRepository
        },
        {
            provide: InventoryEntriesRepository,
            useClass: InventoryEntriesHttpRepository
        },
    ],
})
export class CoreModule {}