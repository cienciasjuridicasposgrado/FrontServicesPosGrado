import { Injectable } from "@angular/core";
import { InventoryOutputsRepository } from "../../../domain/repositories/inventory-outputs.repository";

@Injectable({ 
    providedIn: 'root' 
})
export class DeleteOutputUseCase {
    constructor(private outputsRepository: InventoryOutputsRepository) {}

    async execute(id: number): Promise<void> {
        // Lógica: Requerir una doble confirmación o un permiso de auditoría.
        console.warn(`Operación de eliminación de salida ${id}: requiere reversión de stock en el backend.`);
        
        return this.outputsRepository.deleteOutput(id);
    }
}