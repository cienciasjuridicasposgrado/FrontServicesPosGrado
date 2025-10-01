import { Injectable } from "@angular/core";
import { CreateRoleModel, RoleModel } from "../../../domain/models/role.model";
import { RolesRepository } from "../../../domain/repositories/roles.repository";

@Injectable({
    providedIn: 'root'
})
export class CreateRoleUseCase {
    constructor(private rolesRepository: RolesRepository) {}

    async execute(role: CreateRoleModel): Promise<RoleModel> {
        if (!role.name || role.name.trim().length < 3) {
            return Promise.reject(new Error("El nombre del rol es invalido"));
        }
        
        return this.rolesRepository.createRole(role);
    }
}