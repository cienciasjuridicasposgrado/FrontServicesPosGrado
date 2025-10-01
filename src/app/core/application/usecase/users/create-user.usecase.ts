import { Injectable } from "@angular/core";
import { UsersRepository } from "../../../domain/repositories/users.repository";
import { CreateUserModel, UserModel } from "../../../domain/models/user.model";

@Injectable({
    providedIn: 'root'
})
export class CreateUserUseCase {
    constructor(private usersRepository: UsersRepository) {}

    async execute(user: CreateUserModel): Promise<UserModel> {
        if (!user.password || user.password.length < 8) {
            throw new Error("La contraseña debe tener al menos 8 caracteres.");
        }

        if (!user.nombre || user.nombre.trim().length < 3) {
            throw new Error("El nombre es requerido y debe ser valido.");
        }

        return this.usersRepository.createUser(user);
    }
}