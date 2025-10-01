import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, lastValueFrom } from "rxjs";
import { environment } from "../../../../../environments/environment";
import { ItemModel, CreateItemModel, UpdateItemModel } from "../../../domain/models/item.model";
import { ItemsRepository } from "../../../domain/repositories/items.repository";

@Injectable({ providedIn: 'root' })
export class ItemsHttpRepository extends ItemsRepository {
    private apiBaseUrl = environment.apiUrl + '/items'; 

    constructor(private http: HttpClient) {
        super();
    }

    getAllItems(): Promise<ItemModel[]> {
        const items$: Observable<ItemModel[]> = this.http.get<ItemModel[]>(this.apiBaseUrl);
        return lastValueFrom(items$);
    }

    getItemByCodigo(codigo: string): Promise<ItemModel> {
        const url = `${this.apiBaseUrl}/${codigo}`;
        const item$: Observable<ItemModel> = this.http.get<ItemModel>(url);
        return lastValueFrom(item$);
    }

    createItem(item: CreateItemModel): Promise<ItemModel> {
        const item$: Observable<ItemModel> = this.http.post<ItemModel>(this.apiBaseUrl, item);
        return lastValueFrom(item$);
    }

    updateItem(codigo: string, item: UpdateItemModel): Promise<ItemModel> {
        const url = `${this.apiBaseUrl}/${codigo}`;
        const item$: Observable<ItemModel> = this.http.patch<ItemModel>(url, item);
        return lastValueFrom(item$);
    }

    deleteItem(codigo: string): Promise<void> {
        const url = `${this.apiBaseUrl}/${codigo}`;
        const response$: Observable<void> = this.http.delete<void>(url);
        return lastValueFrom(response$);
    }
}