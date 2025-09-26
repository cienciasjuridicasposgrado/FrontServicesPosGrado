import { Observable } from "rxjs";
import { AuthRepository } from "../../../domain/repositories/auth.repository";
import { User } from "../../../domain/models/user.model";
import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})
export class ProfileUseCase {
    
    constructor(private authRepository: AuthRepository) {}

    execute(): Observable<User> {
        return this.authRepository.getProfile();
    }
}