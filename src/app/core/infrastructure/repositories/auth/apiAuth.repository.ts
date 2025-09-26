import { Injectable } from "@angular/core";
import { AuthRepository } from "../../../domain/repositories/auth.repository";
import { environment } from "../../../../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { Observable, tap } from "rxjs";
import { LoginRequest, LoginResponse, User } from "../../../domain/models/user.model";

@Injectable({
    providedIn: 'root'
})
export class ApiAuthRepository implements AuthRepository {
    
    private apiUrl = `${environment.apiUrl}/auth`;

    constructor(private http: HttpClient) {}

    login(credentials: LoginRequest): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials)
        .pipe(
            tap(response => this.setAuthData(response))
        );
    }

    getProfile(): Observable<User> {
        return this.http.get<User>(`${this.apiUrl}/profile`);
    }

    logout(): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/logout`, {})
        .pipe(
            tap(() => this.clearAuthData())
        );
    }

    getCurrentUser(): User | null {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }

    isAuthenticated(): boolean {
        return !!localStorage.getItem('token');
    }

    private setAuthData(response: LoginResponse): void {
        localStorage.setItem('token', response.access_token);
        localStorage.setItem('user', JSON.stringify(response.user));
    }

    private clearAuthData(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }
}