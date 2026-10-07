import { Injectable } from "@angular/core";
import { InventoryOutputsRepository } from "../../../domain/repositories/inventory-outputs.repository";

@Injectable({ 
    providedIn: 'root' 
})
export class DeleteOutputUseCase {
    constructor(private outputsRepository: InventoryOutputsRepository) {}

    async execute(id: number): Promise<void> {
        if (!id || id <= 0) {
            throw new Error("ID de salida inválido");
        }

        return this.outputsRepository.deleteOutput(id);
    }
}
