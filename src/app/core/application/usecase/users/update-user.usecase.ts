import { Injectable } from "@angular/core";
import { UpdateUserModel, UserModel } from "../../../domain/models/user.model";
import { UsersRepository } from "../../../domain/repositories/users.repository";

@Injectable({ 
    providedIn: 'root' 
})
export class UpdateUserUseCase {
    constructor(private usersRepository: UsersRepository) {}

    async execute(ci: number, user: UpdateUserModel): Promise<UserModel> {
        if (Object.keys(user).length === 0) {
        throw new Error("No se proporcionaron campos para actualizar.");
        }

        return this.usersRepository.updateUser(ci, user);
    }
}