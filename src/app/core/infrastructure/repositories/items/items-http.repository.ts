import { HttpClient } from "@angular/common/http";
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
        return lastValueFrom(this.http.get<ItemModel[]>(this.apiBaseUrl));
    }

    async getItemByCodigo(codigo: string): Promise<ItemModel> {
        return lastValueFrom(
            this.http.get<ItemModel>(`${this.apiBaseUrl}/${codigo}`)
        );
    }

    async createItem(item: CreateItemModel): Promise<ItemModel> {
        const body: CreateItemModel = {
            codigo: item.codigo,
            nombreItem: item.nombreItem,
            unidad: item.unidad
        };

        return lastValueFrom(
                this.http.post<ItemModel>(this.apiBaseUrl, body, {
                headers: { "Content-Type": "application/json" },
                })
            );
    }

    async updateItem(codigo: string, item: UpdateItemModel): Promise<ItemModel> {
        const body: UpdateItemModel = {};
        if (item.nombreItem !== undefined) body.nombreItem = item.nombreItem;
        if (item.unidad !== undefined) body.unidad = item.unidad;

        return lastValueFrom(
                this.http.patch<ItemModel>(`${this.apiBaseUrl}/${codigo}`, body, {
                headers: { "Content-Type": "application/json" },
                })
            );
    }

    async deleteItem(codigo: string): Promise<void> {
        await lastValueFrom(this.http.delete<void>(`${this.apiBaseUrl}/${codigo}`));
    }
}
