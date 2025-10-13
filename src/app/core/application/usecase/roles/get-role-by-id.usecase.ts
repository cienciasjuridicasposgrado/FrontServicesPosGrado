import { Injectable } from "@angular/core";
import { RoleModel } from "../../../domain/models/role.model";
import { RolesRepository } from "../../../domain/repositories/roles.repository";

@Injectable({
    providedIn: 'root'
})
export class GetRoleByIdUseCase {
    constructor(private rolesRepository: RolesRepository) {}

    execute(id: number): Promise<RoleModel> {
        if (!id || id <= 0) {
            return Promise.reject(new Error("ID de rol invalido"));
        }

        return this.rolesRepository.getRoleById(id);
    }
}