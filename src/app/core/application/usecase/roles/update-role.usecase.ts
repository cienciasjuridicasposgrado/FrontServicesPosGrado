import { Injectable } from "@angular/core";
import { RoleModel, UpdateRoleModel } from "../../../domain/models/role.model";
import { RolesRepository } from "../../../domain/repositories/roles.repository";

@Injectable({
    providedIn: 'root'
})
export class UpdateRoleUseCase {
    constructor(private rolesRepository: RolesRepository) {}

    async execute(id: number, role: UpdateRoleModel): Promise<RoleModel> {
        if (id == 1) {
            return Promise.reject(new Error("No se permite actualizar el Rol Super Administrador"));
        }
        return this.rolesRepository.updateRole(id, role);
    }
}