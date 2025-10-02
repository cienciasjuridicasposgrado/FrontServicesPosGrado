import { RoleModel } from "./role.model";

export interface UserModel {
    ci: number;
    nombre: string;
    role_id: number;
    role?: RoleModel;
}

export interface CreateUserModel extends UserModel {
    password: string;
}

export interface UpdateUserModel extends Partial<Omit<UserModel, 'ci'>> {
}

export interface LoginRequest {
    ci: number; 
    password: string;
}

export interface LoginResponse {
    access_token(arg0: string, access_token: any): unknown;
    user: UserModel;
    accessToken: string;
}