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