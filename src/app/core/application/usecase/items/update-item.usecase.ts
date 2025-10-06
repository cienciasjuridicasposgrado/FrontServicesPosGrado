import { Injectable } from "@angular/core";
import { UpdateItemModel, ItemModel } from "../../../domain/models/item.model";
import { ItemsRepository } from "../../../domain/repositories/items.repository";

@Injectable({ 
    providedIn: 'root' 
})
export class UpdateItemUseCase {
    constructor(private itemsRepository: ItemsRepository) {}

    async execute(codigo: string, item: UpdateItemModel): Promise<ItemModel> {
        if ('stock' in item) {
            throw new Error("El stock no se puede actualizar directamente. Use Entradas/Salidas de inventario");
        }

        if (Object.keys(item).length === 0) {
        throw new Error("No se proporcionaron campos para actualizar");
        }
        return this.itemsRepository.updateItem(codigo, item);
    }
}