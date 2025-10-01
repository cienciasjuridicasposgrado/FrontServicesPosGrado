import { Injectable } from "@angular/core";
import { CreateItemModel, ItemModel } from "../../../domain/models/item.model";
import { ItemsRepository } from "../../../domain/repositories/items.repository";

@Injectable({ 
    providedIn: 'root' 
})
export class CreateItemUseCase {
    constructor(private itemsRepository: ItemsRepository) {}

    execute(item: CreateItemModel): Promise<ItemModel> {
        if (!/^[A-Z0-9]+$/.test(item.codigo)) {
        throw new Error("El codigo debe ser alfanumerico sin espacios.");
        }
        return this.itemsRepository.createItem(item);
    }
}