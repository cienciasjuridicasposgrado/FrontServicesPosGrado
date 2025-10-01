import { Injectable } from "@angular/core";
import { UsersRepository } from "../../../domain/repositories/users.repository";

@Injectable({ 
    providedIn: 'root' 
})
export class DeleteUserUseCase {
    constructor(private usersRepository: UsersRepository) {}

    async execute(ci: number): Promise<void> {
        if (ci === 10000000) { 
        return Promise.reject(new Error("No se puede eliminar el usuario administrador principal."));
        }
        
        return this.usersRepository.deleteUser(ci);
    }
}