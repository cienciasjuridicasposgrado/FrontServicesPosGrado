import { RoleModel, CreateRoleModel, UpdateRoleModel } from "../models/role.model";

export abstract class RolesRepository {
    abstract getAllRoles(): Promise<RoleModel[]>;

    abstract getRoleById(id: number): Promise<RoleModel>;

    abstract createRole(role: CreateRoleModel): Promise<RoleModel>;

    abstract updateRole(id: number, role: UpdateRoleModel): Promise<RoleModel>;

    abstract deleteRole(id: number): Promise<void>;
}