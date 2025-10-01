import { InventoryOutputModel, CreateInventoryOutputModel, UpdateInventoryOutputModel } from "../models/inventory-output.model";

export abstract class InventoryOutputsRepository {
    abstract getAllOutputs(): Promise<InventoryOutputModel[]>;

    abstract getOutputById(id: number): Promise<InventoryOutputModel>;

    abstract createOutput(output: CreateInventoryOutputModel): Promise<InventoryOutputModel>;

    abstract updateOutput(id: number, output: UpdateInventoryOutputModel): Promise<InventoryOutputModel>;

    abstract deleteOutput(id: number): Promise<void>;
}