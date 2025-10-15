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

        console.log(`🗑️ Iniciando eliminación de salida ${id} con reversión de stock...`);
        
        try {
            await this.outputsRepository.deleteOutput(id);
            console.log(`Salida ${id} eliminada exitosamente. Stock revertido.`);
        } catch (error: any) {
            console.error(`Error al eliminar salida ${id}:`, error);
            
            if (error.status === 404) {
                throw new Error(`La salida con ID ${id} no existe o ya fue eliminada.`);
            } else if (error.status === 403) {
                throw new Error("No tiene permisos para eliminar esta salida.");
            } else if (error.status === 409) {
                throw new Error("No se puede eliminar esta salida porque afectaría el stock actual.");
            } else {
                throw new Error(`Error al eliminar la salida: ${error.message || 'Error del servidor'}`);
            }
        }
    }
}