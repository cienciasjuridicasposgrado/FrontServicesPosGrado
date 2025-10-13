import { Injectable } from "@angular/core";
import { RolesRepository } from "../../../domain/repositories/roles.repository";

@Injectable({
    providedIn: 'root'
})
export class DeleteRoleUseCase {
    constructor(private rolesRepository: RolesRepository) {}

    async execute(id: number): Promise<void> {
        if (id <= 2) {
            return Promise.reject(new Error("No se permite eliminar roles del sistema (IDs 1 y 2)."));
        }
        return this.rolesRepository.deleteRole(id);
    }
}