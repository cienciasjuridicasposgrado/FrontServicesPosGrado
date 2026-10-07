import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../../environments/environment";
import { UsersRepository } from "../../../domain/repositories/users.repository";
import { Observable, lastValueFrom } from "rxjs";
import { ChangeUserRoleModel, UserModel, CreateUserModel, UpdateUserModel } from "../../../domain/models/user.model";
import { UserLookupModel } from "../../../domain/models/user-lookup.model";
import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})
export class UsersHttpRepository extends UsersRepository {
    private apiBaseUrl = environment.apiUrl + '/users';

    constructor(private http: HttpClient){
        super();
    }

    getAllUsers(): Promise<UserModel[]> {
        const users$: Observable<UserModel[]> = this.http.get<UserModel[]>(this.apiBaseUrl);
        return lastValueFrom(users$);
    }

    getLookup(): Promise<UserLookupModel[]> {
        const lookup$: Observable<UserLookupModel[]> = this.http.get<UserLookupModel[]>(`${this.apiBaseUrl}/lookup`);
        return lastValueFrom(lookup$);
    }

    getUserByCi(ci: number): Promise<UserModel> {
        const url = `${this.apiBaseUrl}/${ci}`;
        const user$: Observable<UserModel> = this.http.get<UserModel>(url);
        return lastValueFrom(user$);
    }

    createUser(user: CreateUserModel): Promise<UserModel> {
        const body: CreateUserModel = {
            ci: user.ci,
            nombre: user.nombre,
            password: user.password,
            role_id: user.role_id
        };
        const user$: Observable<UserModel> = this.http.post<UserModel>(this.apiBaseUrl, body);
        return lastValueFrom(user$); 
    }

    updateUser(ci: number, user: UpdateUserModel): Promise<UserModel> {
        const url = `${this.apiBaseUrl}/${ci}`;
        const body: UpdateUserModel = {};

        if (user.ci !== undefined) body.ci = user.ci;
        if (user.nombre !== undefined) body.nombre = user.nombre;
        if (user.password !== undefined) body.password = user.password;

        const user$: Observable<UserModel> = this.http.patch<UserModel>(url, body);
        return lastValueFrom(user$);
    }

    updateUserRole(ci: number, role: ChangeUserRoleModel): Promise<UserModel> {
        const url = `${this.apiBaseUrl}/${ci}/role`;
        const body: ChangeUserRoleModel = { role_id: role.role_id };
        const user$: Observable<UserModel> = this.http.patch<UserModel>(url, body);
        return lastValueFrom(user$);
    }

    deleteUser(ci: number): Promise<void> {
        const url = `${this.apiBaseUrl}/${ci}`;
        const response$: Observable<void> = this.http.delete<void>(url);
        return lastValueFrom(response$);
    }
}
