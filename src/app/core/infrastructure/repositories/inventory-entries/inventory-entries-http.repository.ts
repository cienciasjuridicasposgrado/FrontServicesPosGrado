import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, lastValueFrom } from "rxjs";
import { environment } from "../../../../../environments/environment";
import { InventoryEntryModel, CreateInventoryEntryModel, UpdateInventoryEntryModel } from "../../../domain/models/inventory-entry.model";
import { InventoryEntriesRepository } from "../../../domain/repositories/inventory-entries.repository";

@Injectable({ 
    providedIn: 'root' 
})
export class InventoryEntriesHttpRepository extends InventoryEntriesRepository {
    private apiBaseUrl = environment.apiUrl + '/inventory-entries'; 

    constructor(private http: HttpClient) {
        super();
    }

    getAllEntries(): Promise<InventoryEntryModel[]> {
        const entries$: Observable<InventoryEntryModel[]> = this.http.get<InventoryEntryModel[]>(this.apiBaseUrl);
        return lastValueFrom(entries$);
    }

    getEntryById(id: number): Promise<InventoryEntryModel> {
        const url = `${this.apiBaseUrl}/${id}`;
        const entry$: Observable<InventoryEntryModel> = this.http.get<InventoryEntryModel>(url);
        return lastValueFrom(entry$);
    }

    createEntry(entry: CreateInventoryEntryModel): Promise<InventoryEntryModel> {
        const entry$: Observable<InventoryEntryModel> = this.http.post<InventoryEntryModel>(this.apiBaseUrl, entry);
        return lastValueFrom(entry$);
    }

    updateEntry(id: number, entry: UpdateInventoryEntryModel): Promise<InventoryEntryModel> {
        const url = `${this.apiBaseUrl}/${id}`;
        const entry$: Observable<InventoryEntryModel> = this.http.patch<InventoryEntryModel>(url, entry);
        return lastValueFrom(entry$);
    }

    deleteEntry(id: number): Promise<void> {
        const url = `${this.apiBaseUrl}/${id}`;
        const response$: Observable<void> = this.http.delete<void>(url);
        return lastValueFrom(response$);
    }
}