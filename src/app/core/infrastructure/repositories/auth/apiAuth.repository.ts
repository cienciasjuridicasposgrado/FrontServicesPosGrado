import { Injectable } from "@angular/core";
import { AuthRepository } from "../../../domain/repositories/auth.repository";
import { environment } from "../../../../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { LoginRequest, LoginResponse, UserModel } from "../../../domain/models/user.model";

@Injectable({
    providedIn: 'root'
})
export class ApiAuthRepository extends AuthRepository {
    
    private apiBaseUrl = `${environment.apiUrl}/auth`;

    constructor(private http: HttpClient) {
        super();
    }

    login(credentials: LoginRequest): Observable<LoginResponse> {
        const url = `${this.apiBaseUrl}/login`; 
        return this.http.post<LoginResponse>(url, credentials);
    }

    logout(): Observable<void> {
        return this.http.post<void>(`${this.apiBaseUrl}/logout`, {});
    }

    getProfile(): Observable<UserModel> {
        const url = `${this.apiBaseUrl}/profile`; 
        return this.http.get<UserModel>(url);
    }
}
