import { Observable } from "rxjs";
import { LoginRequest, LoginResponse } from "../../../domain/models/user.model";
import { AuthRepository } from "../../../domain/repositories/auth.repository";
import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})
export class LoginUseCase {

    constructor(private authRepository: AuthRepository) {}

    execute(credentials: LoginRequest): Observable<LoginResponse> {
        return this.authRepository.login(credentials);
    }
}