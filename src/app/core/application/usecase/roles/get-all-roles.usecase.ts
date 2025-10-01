import { Injectable } from "@angular/core";
import { RoleModel } from "../../../domain/models/role.model";
import { RolesRepository } from "../../../domain/repositories/roles.repository";

@Injectable({
    providedIn: 'root'
})
export class GetAllRolesUseCase {
    constructor(private rolesRepository: RolesRepository) {}

    execute(): Promise<RoleModel[]> {
        return this.rolesRepository.getAllRoles();
    }
}