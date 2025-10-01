import { CreateUserModel, UpdateUserModel, UserModel } from "../models/user.model";

export abstract class UsersRepository {

    abstract getAllUsers(): Promise<UserModel[]>;

    abstract getUserByCi(ci: number): Promise<UserModel>;

    abstract createUser(user: CreateUserModel): Promise<UserModel>;

    abstract updateUser(ci: number, user: UpdateUserModel): Promise<UserModel>;

    abstract deleteUser(ci: number): Promise<void>;
}