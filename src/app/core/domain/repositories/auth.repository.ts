import { Observable } from "rxjs";
import { LoginRequest, LoginResponse, UserModel } from "../models/user.model";

export abstract class AuthRepository {
    abstract login(credentials: LoginRequest): Observable<LoginResponse>;
    abstract getProfile(): Observable<UserModel>;
    abstract logout(): Observable<void>;
    abstract getCurrentUser(): UserModel | null;
    abstract isAuthenticated(): boolean;
}