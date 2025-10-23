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
import { InventoryOutputsRepository } from "./domain/repositories/inventory-outputs.repository";
import { InventoryOutputsHttpRepository } from "./infrastructure/repositories/inventory-outputs/inventory-outputs-http.repository";
import { SealNumbersRepository } from "./domain/repositories/seal-numbers.repository";
import { SealNumbersRepositoryImpl } from "./infrastructure/repositories/seal-numbers/seal-numbers-http.repository";

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
        {
            provide: InventoryOutputsRepository,
            useClass: InventoryOutputsHttpRepository
        },
        {
            provide: SealNumbersRepository,
            useClass: SealNumbersRepositoryImpl
        }
    ],
})
export class CoreModule {}