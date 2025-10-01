import { Injectable } from "@angular/core";
import { UsersRepository } from "../../../domain/repositories/users.repository";
import { UserModel } from "../../../domain/models/user.model";

@Injectable({
    providedIn: 'root'
})
export class GetAllUsersUseCase {
    constructor(private usersRepository: UsersRepository) {}

    execute(): Promise<UserModel[]> {
        return this.usersRepository.getAllUsers();
    }
}