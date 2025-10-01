import { Injectable } from "@angular/core";
import { DepartamentosRepository } from "../../../domain/repositories/departamentos.repository";
import { environment } from "../../../../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { Observable, lastValueFrom } from "rxjs";
import { DepartamentoModel, CreateDepartamentoModel, UpdateDepartamentoModel } from "../../../domain/models/departamento.model";

@Injectable({
    providedIn: 'root'
})
export class DepartamentosHttpRepository extends DepartamentosRepository {
    private apiBaseUrl = environment.apiUrl + '/departamentos';

    constructor(private http: HttpClient) {
        super();
    }

    getAllDepartamentos(): Promise<DepartamentoModel[]> {
        const depas$: Observable<DepartamentoModel[]> = this.http.get<DepartamentoModel[]>(this.apiBaseUrl);
        return lastValueFrom(depas$);
    }

    getDepartamentoById(id: number): Promise<DepartamentoModel> {
        const url = `${this.apiBaseUrl}/${id}`;
        const depa$: Observable<DepartamentoModel> = this.http.get<DepartamentoModel>(url);
        return lastValueFrom(depa$);
    }

    createDepartamento(departamento: CreateDepartamentoModel): Promise<DepartamentoModel> {
        const depa$: Observable<DepartamentoModel> = this.http.post<DepartamentoModel>(this.apiBaseUrl, departamento);
        return lastValueFrom(depa$);
    }

    updateDepartamento(id: number, departamento: UpdateDepartamentoModel): Promise<DepartamentoModel> {
        const url = `${this.apiBaseUrl}/${id}`;
        const depa$: Observable<DepartamentoModel> = this.http.patch<DepartamentoModel>(url, departamento);
        return lastValueFrom(depa$);
    }

    deleteDepartamento(id: number): Promise<void> {
        const url = `${this.apiBaseUrl}/${id}`;
        const response$: Observable<void> = this.http.delete<void>(url);
        return lastValueFrom(response$);
    }
}