import { Injectable } from "@angular/core";
import { CreateInventoryEntryModel, InventoryEntryModel } from "../../../domain/models/inventory-entry.model";
import { InventoryEntriesRepository } from "../../../domain/repositories/inventory-entries.repository";

@Injectable({ 
    providedIn: 'root' 
})
export class CreateEntryUseCase {
    constructor(private entriesRepository: InventoryEntriesRepository) {}

    async execute(entry: CreateInventoryEntryModel): Promise<InventoryEntryModel> {
        if (entry.cantidad <= 0) {
        throw new Error("La cantidad de entrada debe ser un número positivo.");
        }
        if (!entry.itemCodigo) {
            throw new Error("Debe especificar el código del ítem a ingresar.");
        }
        
        return this.entriesRepository.createEntry(entry);
    }
}