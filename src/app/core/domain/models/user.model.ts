import { RoleModel } from "./role.model";

export interface UserModel {
    ci: number;
    nombre: string;
    roleId: number;
    role?: RoleModel | null;
}

export interface CreateUserModel {
    ci: number;
    nombre: string;
    password: string;
    role_id: number;
}

export interface UpdateUserModel {
    ci?: number;
    nombre?: string;
    password?: string;
}

export interface ChangeUserRoleModel {
    role_id: number;
}

export interface LoginRequest {
    ci: number; 
    password: string;
}

export interface LoginResponse {
    access_token: string;
}
