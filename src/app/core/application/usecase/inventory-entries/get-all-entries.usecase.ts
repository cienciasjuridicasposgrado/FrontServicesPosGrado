import { Injectable } from "@angular/core";
import { InventoryEntryModel } from "../../../domain/models/inventory-entry.model";
import { InventoryEntriesRepository } from "../../../domain/repositories/inventory-entries.repository";

@Injectable({ 
    providedIn: 'root' 
})
export class GetAllEntriesUseCase {
    constructor(private entriesRepository: InventoryEntriesRepository) {}

    execute(): Promise<InventoryEntryModel[]> {
        return this.entriesRepository.getAllEntries();
    }
}