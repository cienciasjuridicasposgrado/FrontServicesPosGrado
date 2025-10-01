import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../../environments/environment";
import { RolesRepository } from "../../../domain/repositories/roles.repository";
import { Observable, lastValueFrom } from "rxjs";
import { RoleModel, CreateRoleModel, UpdateRoleModel } from "../../../domain/models/role.model";
import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})
export class RolesHttpRepository extends RolesRepository {
    private apiBaseUrl = environment.apiUrl + '/roles';

    constructor(private http: HttpClient) {
        super();
    }

    getAllRoles(): Promise<RoleModel[]> {
        const roles$: Observable<RoleModel[]> = this.http.get<RoleModel[]>(this.apiBaseUrl);
        return lastValueFrom(roles$);
    }

    getRoleById(id: number): Promise<RoleModel> {
        const url = `${this.apiBaseUrl}/${id}`;
        const role$: Observable<RoleModel> = this.http.get<RoleModel>(url);
        return lastValueFrom(role$);
    }

    createRole(role: CreateRoleModel): Promise<RoleModel> {
        const role$: Observable<RoleModel> = this.http.post<RoleModel>(this.apiBaseUrl, role);
        return lastValueFrom(role$);
    }

    updateRole(id: number, role: UpdateRoleModel): Promise<RoleModel> {
        const url = `${this.apiBaseUrl}/${id}`;
        const role$: Observable<RoleModel> = this.http.patch<RoleModel>(url, role); // Usamos PATCH
        return lastValueFrom(role$);
    }

    deleteRole(id: number): Promise<void> {
        const url = `${this.apiBaseUrl}/${id}`;
        const response$: Observable<void> = this.http.delete<void>(url);
        return lastValueFrom(response$);
    }
}