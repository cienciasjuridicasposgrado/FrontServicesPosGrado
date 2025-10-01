import { Injectable } from "@angular/core";
import { UpdateInventoryEntryModel, InventoryEntryModel } from "../../../domain/models/inventory-entry.model";
import { InventoryEntriesRepository } from "../../../domain/repositories/inventory-entries.repository";

@Injectable({ 
    providedIn: 'root' 
})
export class UpdateEntryUseCase {
    constructor(private entriesRepository: InventoryEntriesRepository) {}

    async execute(id: number, entry: UpdateInventoryEntryModel): Promise<InventoryEntryModel> {
        if (entry.observacion === undefined || Object.keys(entry).length > 1) {
        throw new Error("Solo se permite actualizar el campo 'observacion'. La transacción es inmutable.");
        }
        return this.entriesRepository.updateEntry(id, entry);
    }
}