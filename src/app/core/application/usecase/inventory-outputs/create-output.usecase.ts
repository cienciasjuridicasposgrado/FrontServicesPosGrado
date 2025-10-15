import { Injectable } from "@angular/core";
import { CreateInventoryOutputModel, InventoryOutputModel } from "../../../domain/models/inventory-output.model";
import { InventoryOutputsRepository } from "../../../domain/repositories/inventory-outputs.repository";
import { ItemsRepository } from "../../../domain/repositories/items.repository";

@Injectable({ 
    providedIn: 'root' 
})
export class CreateOutputUseCase {
    constructor(
        private outputsRepository: InventoryOutputsRepository,
        private itemsRepository: ItemsRepository
    ) {}

    async execute(output: CreateInventoryOutputModel): Promise<InventoryOutputModel> {
        if (output.cantidad <= 0 || !output.departamentoId) {
        throw new Error("Cantidad y departamento de destino son requeridos.");
        }
        
        const item = await this.itemsRepository.getItemByCodigo(output.itemCodigo);
        if (item.stock < output.cantidad) {
        throw new Error(`Stock insuficiente. Solo hay ${item.stock} unidades de ${item.nombreItem}.`);
        }

        return this.outputsRepository.createOutput(output);
    }
}