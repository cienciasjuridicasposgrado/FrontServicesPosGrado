import { Role } from "./role.model";

export interface User {
    ci: number;
    nombre: string;
    password?: string;
    role_id: number;
    remember_token?: string;
    created_at?: string;
    updated_at?: string;
    role?: Role;
}

export interface LoginRequest {
    ci: number;
    password: string;
}

export interface LoginResponse {
    access_token: string;
    user: User;
}