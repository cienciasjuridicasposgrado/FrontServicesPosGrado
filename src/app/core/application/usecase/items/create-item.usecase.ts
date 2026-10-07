import { Injectable } from "@angular/core";
import { CreateItemModel, ItemModel } from "../../../domain/models/item.model";
import { ItemsRepository } from "../../../domain/repositories/items.repository";

@Injectable({ 
    providedIn: 'root' 
})
export class CreateItemUseCase {
    constructor(private itemsRepository: ItemsRepository) {}

    execute(item: CreateItemModel): Promise<ItemModel> {
        if (!item.codigo?.trim() || !item.nombreItem?.trim() || !item.unidad?.trim()) {
            throw new Error("Codigo, nombre y unidad son campos obligatorios");
        }

        return this.itemsRepository.createItem({
            codigo: item.codigo.trim().toUpperCase(),
            nombreItem: item.nombreItem,
            unidad: item.unidad
        });
    }
}
