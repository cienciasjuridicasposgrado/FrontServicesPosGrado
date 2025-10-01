import { Injectable } from "@angular/core";
import { InventoryOutputModel } from "../../../domain/models/inventory-output.model";
import { InventoryOutputsRepository } from "../../../domain/repositories/inventory-outputs.repository";

@Injectable({ 
    providedIn: 'root' 
})
export class GetOutputByIdUseCase {
    constructor(private outputsRepository: InventoryOutputsRepository) {}

    execute(id: number): Promise<InventoryOutputModel> {
        return this.outputsRepository.getOutputById(id);
    }
}