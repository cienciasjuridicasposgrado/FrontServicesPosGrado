import { Injectable } from "@angular/core";
import { UpdateInventoryOutputModel, InventoryOutputModel } from "../../../domain/models/inventory-output.model";
import { InventoryOutputsRepository } from "../../../domain/repositories/inventory-outputs.repository";

@Injectable({ 
    providedIn: 'root' 
})
export class UpdateOutputUseCase {
    constructor(private outputsRepository: InventoryOutputsRepository) {}

    async execute(id: number, output: UpdateInventoryOutputModel): Promise<InventoryOutputModel> {
        // Lógica: Solo permitir actualizar la observación.
        if (output.observacion === undefined || Object.keys(output).length > 1) {
        throw new Error("Solo se permite actualizar el campo 'observacion'.");
        }
        return this.outputsRepository.updateOutput(id, output);
    }
}