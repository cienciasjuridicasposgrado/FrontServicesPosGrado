import { CommonModule } from "@angular/common";
import { HttpClientModule } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { RolesRepository } from "./domain/repositories/roles.repository";
import { RolesHttpRepository } from "./infrastructure/repositories/roles/roles-http.repository";
import { UsersRepository } from "./domain/repositories/users.repository";
import { UsersHttpRepository } from "./infrastructure/repositories/users/users-http.repository";
import { DepartamentosRepository } from "./domain/repositories/departamentos.repository";
import { DepartamentosHttpRepository } from "./infrastructure/repositories/departamentos/departamentos-http.repository";

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
    ],
})
export class CoreModule {}