import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../../environments/environment";
import { UsersRepository } from "../../../domain/repositories/users.repository";
import { Observable, lastValueFrom } from "rxjs";
import { UserModel, CreateUserModel, UpdateUserModel } from "../../../domain/models/user.model";
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

    getUserByCi(ci: number): Promise<UserModel> {
        const url = `${this.apiBaseUrl}/${ci}`;
        const user$: Observable<UserModel> = this.http.get<UserModel>(url);
        return lastValueFrom(user$);
    }

    createUser(user: CreateUserModel): Promise<UserModel> {
        const user$: Observable<UserModel> = this.http.post<UserModel>(this.apiBaseUrl, user);
        return lastValueFrom(user$); 
    }

    updateUser(ci: number, user: UpdateUserModel): Promise<UserModel> {
        const url = `${this.apiBaseUrl}/${ci}`;
        const user$: Observable<UserModel> = this.http.patch<UserModel>(url, user);
        return lastValueFrom(user$);
    }

    deleteUser(ci: number): Promise<void> {
        const url = `${this.apiBaseUrl}/${ci}`;
        const response$: Observable<void> = this.http.delete<void>(url);
        return lastValueFrom(response$);
    }
}