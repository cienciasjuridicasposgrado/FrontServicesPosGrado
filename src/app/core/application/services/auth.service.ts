import { Router } from "@angular/router";
import { AuthRepository } from "../../domain/repositories/auth.repository";
import { LoginUseCase } from "../usecase/auth/login.usecase";
import { ProfileUseCase } from "../usecase/auth/profile.usecase";
import { LoginRequest, User } from "../../domain/models/user.model";
import { Observable } from "rxjs";
import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    constructor(
        private loginUseCase: LoginUseCase,
        private profileUseCase: ProfileUseCase,
        private authRepository: AuthRepository,
        private router: Router
    ) {}

    login(credentials: LoginRequest): Observable<any> {
        return this.loginUseCase.execute(credentials);
    }

    getProfile(): Observable<User> {
        return this.profileUseCase.execute();
    }

    logout(): void {
        this.authRepository.logout().subscribe({
            next: () => {
                this.router.navigate(['/auth/login']);
            },
            error: () => {
                //Fallback: limpiar los datos localmente incluso si el logout falla
                this.clearAuthData();
                this.router.navigate(['/auth/login']);
            }
        });
    }

    getCurrentUser(): User | null {
        return this.authRepository.getCurrentUser();
    }

    isAuthenticated(): boolean {
        return this.authRepository.isAuthenticated();
    }

    private clearAuthData(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }
}