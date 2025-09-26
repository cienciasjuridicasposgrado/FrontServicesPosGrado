import { Observable } from "rxjs";
import { LoginRequest, LoginResponse, User } from "../models/user.model";

export abstract class AuthRepository {
    abstract login(credentials: LoginRequest): Observable<LoginResponse>;
    abstract getProfile(): Observable<User>;
    abstract logout(): Observable<void>;
    abstract getCurrentUser(): User | null;
    abstract isAuthenticated(): boolean;
}