import { Injectable } from "@angular/core";
import { InventoryOutputModel } from "../../../domain/models/inventory-output.model";
import { InventoryOutputsRepository } from "../../../domain/repositories/inventory-outputs.repository";

@Injectable({ 
    providedIn: 'root' 
})
export class GetAllOutputsUseCase {
    constructor(private outputsRepository: InventoryOutputsRepository) {}

    execute(): Promise<InventoryOutputModel[]> {
        return this.outputsRepository.getAllOutputs();
    }
}