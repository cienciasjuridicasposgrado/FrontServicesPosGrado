import { Injectable } from "@angular/core";
import { UsersRepository } from "../../../domain/repositories/users.repository";
import { UserModel } from "../../../domain/models/user.model";

@Injectable({
    providedIn: 'root'
})
export class GetUserByCiUseCase {
    constructor(private usersRepository: UsersRepository) {}

    execute(ci: number): Promise<UserModel> {
        return this.usersRepository.getUserByCi(ci);
    }
}