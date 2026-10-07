import { Injectable } from "@angular/core";
import { UpdateItemModel, ItemModel } from "../../../domain/models/item.model";
import { ItemsRepository } from "../../../domain/repositories/items.repository";

@Injectable({ 
    providedIn: 'root' 
})
export class UpdateItemUseCase {
    constructor(private itemsRepository: ItemsRepository) {}

    async execute(codigo: string, item: UpdateItemModel): Promise<ItemModel> {
        const update: UpdateItemModel = {};
        if (item.nombreItem !== undefined) update.nombreItem = item.nombreItem;
        if (item.unidad !== undefined) update.unidad = item.unidad;

        if (Object.keys(update).length === 0) {
            throw new Error("No se proporcionaron campos para actualizar");
        }
        return this.itemsRepository.updateItem(codigo, update);
    }
}
