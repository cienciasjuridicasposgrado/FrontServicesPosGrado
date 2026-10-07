import { Injectable } from '@angular/core';
import { ChangeUserRoleModel, UserModel } from '../../../domain/models/user.model';
import { UsersRepository } from '../../../domain/repositories/users.repository';

@Injectable({
    providedIn: 'root'
})
export class ChangeUserRoleUseCase {
    constructor(private usersRepository: UsersRepository) {}

    execute(ci: number, role: ChangeUserRoleModel): Promise<UserModel> {
        if (!Number.isInteger(ci) || ci < 1000000 || ci > 99999999) {
            return Promise.reject(new Error('La cédula debe tener entre 7 y 8 dígitos.'));
        }

        if (!Number.isInteger(role.role_id) || role.role_id < 1) {
            return Promise.reject(new Error('El rol seleccionado no es válido.'));
        }

        return this.usersRepository.updateUserRole(ci, role);
    }
}
