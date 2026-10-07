import { Injectable } from "@angular/core";
import { CreateInventoryOutputModel, InventoryOutputModel } from "../../../domain/models/inventory-output.model";
import { InventoryOutputsRepository } from "../../../domain/repositories/inventory-outputs.repository";
import { ItemsRepository } from "../../../domain/repositories/items.repository";
import { isValidInventoryQuantity } from "../../../../shared/validators/inventory-quantity.validator";

@Injectable({ 
    providedIn: 'root' 
})
export class CreateOutputUseCase {
    constructor(
        private outputsRepository: InventoryOutputsRepository,
        private itemsRepository: ItemsRepository
    ) {}

    async execute(output: CreateInventoryOutputModel): Promise<InventoryOutputModel> {
        if (!isValidInventoryQuantity(output.cantidad)) {
            throw new Error("La cantidad de salida debe ser un entero entre 1 y 10000.");
        }
        if (!output.itemCodigo || !output.departamentoId) {
            throw new Error("Ítem y departamento de destino son requeridos.");
        }

        // Es solo una ayuda de UX. El backend vuelve a validar el stock de forma
        // transaccional porque este valor puede quedar obsoleto por concurrencia.
        const item = await this.itemsRepository.getItemByCodigo(output.itemCodigo);
        if (item.stock < output.cantidad) {
        throw new Error(`Stock insuficiente. Solo hay ${item.stock} unidades de ${item.nombreItem}.`);
        }

        return this.outputsRepository.createOutput(output);
    }
}
