import { Injectable } from "@angular/core";
import { UpdateItemModel, ItemModel } from "../../../domain/models/item.model";
import { ItemsRepository } from "../../../domain/repositories/items.repository";

@Injectable({ 
    providedIn: 'root' 
})
export class UpdateItemUseCase {
    constructor(private itemsRepository: ItemsRepository) {}

    async execute(codigo: string, item: UpdateItemModel): Promise<ItemModel> {
        if (Object.keys(item).includes('stock')) {
        throw new Error("El stock se gestiona a traves de entradas y salidas, no de forma directa.");
        }
        return this.itemsRepository.updateItem(codigo, item);
    }
}