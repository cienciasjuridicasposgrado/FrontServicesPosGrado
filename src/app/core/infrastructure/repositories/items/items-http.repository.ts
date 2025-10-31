import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { lastValueFrom } from "rxjs";
import { environment } from "../../../../../environments/environment";
import { ItemModel, CreateItemModel, UpdateItemModel } from "../../../domain/models/item.model";
import { ItemsRepository } from "../../../domain/repositories/items.repository";

@Injectable({ 
    providedIn: 'root' 
})
export class ItemsHttpRepository extends ItemsRepository {
    private apiBaseUrl = `${environment.apiUrl}/items`; 

    constructor(private http: HttpClient) {
        super();
    }

    async getAllItems(): Promise<ItemModel[]> {
        try {
            return await lastValueFrom(this.http.get<ItemModel[]>(this.apiBaseUrl));
        } catch (error) {
            this.handleError(error, "Error al obtener los ítems.");
        }
    }

    async getItemByCodigo(codigo: string): Promise<ItemModel> {
        try {
            return await lastValueFrom(
                this.http.get<ItemModel>(`${this.apiBaseUrl}/${codigo}`)
            );
        } catch (error) {
            this.handleError(error, `Error al obtener el ítem con código ${codigo}.`);
        }
    }

    async createItem(item: CreateItemModel): Promise<ItemModel> {
        try {
            console.log("Payload enviado:", item); 
            return await lastValueFrom(
                this.http.post<ItemModel>(this.apiBaseUrl, item, {
                headers: { "Content-Type": "application/json" },
                })
            );
        } catch (error) {
            this.handleError(error, "Error al crear el ítem.");
        }
    }

    async updateItem(codigo: string, item: UpdateItemModel): Promise<ItemModel> {
        try {
            return await lastValueFrom(
                this.http.patch<ItemModel>(`${this.apiBaseUrl}/${codigo}`, item, {
                headers: { "Content-Type": "application/json" },
                })
            );
        } catch (error) {
            this.handleError(error, `Error al actualizar el ítem ${codigo}.`);
        }
    }

    async deleteItem(codigo: string): Promise<void> {
        try {
            await lastValueFrom(this.http.delete<void>(`${this.apiBaseUrl}/${codigo}`));
        } catch (error) {
            this.handleError(error, `Error al eliminar el ítem ${codigo}.`);
        }
    }

    private handleError(error: unknown, message: string): never {
        if (error instanceof HttpErrorResponse) {
            console.error("HTTP Error:", error.message, error.error);
            throw new Error(`${message} (${error.status}: ${error.statusText})`);
        } else {
            console.error("Error desconocido:", error);
            throw new Error(message);
        }
    }
}