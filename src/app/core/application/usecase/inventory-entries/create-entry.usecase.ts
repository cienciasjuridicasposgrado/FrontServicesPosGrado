import { Injectable } from "@angular/core";
import { CreateInventoryEntryModel, InventoryEntryModel } from "../../../domain/models/inventory-entry.model";
import { InventoryEntriesRepository } from "../../../domain/repositories/inventory-entries.repository";
import { isValidInventoryQuantity } from "../../../../shared/validators/inventory-quantity.validator";

@Injectable({ 
    providedIn: 'root' 
})
export class CreateEntryUseCase {
    constructor(private entriesRepository: InventoryEntriesRepository) {}

    async execute(entry: CreateInventoryEntryModel): Promise<InventoryEntryModel> {
        if (!isValidInventoryQuantity(entry.cantidad)) {
            throw new Error("La cantidad de entrada debe ser un entero entre 1 y 10000.");
        }
        if (!entry.itemCodigo) {
            throw new Error("Debe especificar el código del ítem a ingresar.");
        }
        
        return this.entriesRepository.createEntry(entry);
    }
}
