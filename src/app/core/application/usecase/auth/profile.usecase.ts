import { Observable } from "rxjs";
import { AuthRepository } from "../../../domain/repositories/auth.repository";
import { UserModel } from "../../../domain/models/user.model";
import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})
export class GetProfileUseCase {
    
    constructor(private authRepository: AuthRepository) {}

    execute(): Observable<UserModel> {
        return this.authRepository.getProfile();
    }
}