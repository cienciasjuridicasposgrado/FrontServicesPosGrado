import { ChangeUserRoleModel, CreateUserModel, UpdateUserModel, UserModel } from "../models/user.model";
import { UserLookupModel } from "../models/user-lookup.model";

export abstract class UsersRepository {

    abstract getAllUsers(): Promise<UserModel[]>;

    abstract getLookup(): Promise<UserLookupModel[]>;

    abstract getUserByCi(ci: number): Promise<UserModel>;

    abstract createUser(user: CreateUserModel): Promise<UserModel>;

    abstract updateUser(ci: number, user: UpdateUserModel): Promise<UserModel>;

    abstract updateUserRole(ci: number, role: ChangeUserRoleModel): Promise<UserModel>;

    abstract deleteUser(ci: number): Promise<void>;
}
