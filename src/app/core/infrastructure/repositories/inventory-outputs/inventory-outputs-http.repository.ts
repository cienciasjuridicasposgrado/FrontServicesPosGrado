import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, lastValueFrom } from "rxjs";
import { environment } from "../../../../../environments/environment";
import { InventoryOutputModel, CreateInventoryOutputModel, UpdateInventoryOutputModel } from "../../../domain/models/inventory-output.model";
import { InventoryOutputsRepository } from "../../../domain/repositories/inventory-outputs.repository";

@Injectable({ 
    providedIn: 'root' 
})
export class InventoryOutputsHttpRepository extends InventoryOutputsRepository {
    private apiBaseUrl = environment.apiUrl + '/inventory-outputs'; 

    constructor(private http: HttpClient) {
        super();
    }

    getAllOutputs(): Promise<InventoryOutputModel[]> {
        const outputs$: Observable<InventoryOutputModel[]> = this.http.get<InventoryOutputModel[]>(this.apiBaseUrl);
        return lastValueFrom(outputs$);
    }

    getOutputById(id: number): Promise<InventoryOutputModel> {
        const url = `${this.apiBaseUrl}/${id}`;
        const output$: Observable<InventoryOutputModel> = this.http.get<InventoryOutputModel>(url);
        return lastValueFrom(output$);
    }

    createOutput(output: CreateInventoryOutputModel): Promise<InventoryOutputModel> {
        const output$: Observable<InventoryOutputModel> = this.http.post<InventoryOutputModel>(this.apiBaseUrl, output);
        return lastValueFrom(output$);
    }

    updateOutput(id: number, output: UpdateInventoryOutputModel): Promise<InventoryOutputModel> {
        const url = `${this.apiBaseUrl}/${id}`;
        const output$: Observable<InventoryOutputModel> = this.http.patch<InventoryOutputModel>(url, output);
        return lastValueFrom(output$);
    }

    deleteOutput(id: number): Promise<void> {
        const url = `${this.apiBaseUrl}/${id}`;
        const response$: Observable<void> = this.http.delete<void>(url);
        return lastValueFrom(response$);
    }
}