import { Injectable } from "@angular/core";
import { UsersRepository } from "../../../domain/repositories/users.repository";
import { CreateUserModel, UserModel } from "../../../domain/models/user.model";

@Injectable({
    providedIn: 'root'
})
export class CreateUserUseCase {
    constructor(private usersRepository: UsersRepository) {}

    async execute(user: CreateUserModel): Promise<UserModel> {
        if (!Number.isInteger(user.ci) || user.ci < 1000000 || user.ci > 99999999) {
            throw new Error("La cédula debe tener entre 7 y 8 dígitos.");
        }

        if (!user.password || user.password.length < 8) {
            throw new Error("La contraseña debe tener al menos 8 caracteres.");
        }

        if (!user.nombre || user.nombre.trim().length < 3) {
            throw new Error("El nombre es requerido y debe ser valido.");
        }

        if (!Number.isInteger(user.role_id) || user.role_id < 1) {
            throw new Error("El rol seleccionado no es válido.");
        }

        return this.usersRepository.createUser(user);
    }
}
