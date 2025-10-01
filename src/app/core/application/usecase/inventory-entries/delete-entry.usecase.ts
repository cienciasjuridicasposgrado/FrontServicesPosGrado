import { Injectable } from "@angular/core";
import { InventoryEntriesRepository } from "../../../domain/repositories/inventory-entries.repository";

@Injectable({ 
    providedIn: 'root' 
})
export class DeleteEntryUseCase {
    constructor(private entriesRepository: InventoryEntriesRepository) {}

    async execute(id: number): Promise<void> {
        console.warn(`Attempting to delete entry ID: ${id}. This operation must be logged and audited.`);
        return this.entriesRepository.deleteEntry(id);
    }
}