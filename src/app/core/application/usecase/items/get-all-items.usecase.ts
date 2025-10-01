import { Injectable } from "@angular/core";
import { ItemModel } from "../../../domain/models/item.model";
import { ItemsRepository } from "../../../domain/repositories/items.repository";

@Injectable({ 
    providedIn: 'root' 
})
export class GetAllItemsUseCase {
    constructor(private itemsRepository: ItemsRepository) {}

    execute(): Promise<ItemModel[]> {
        return this.itemsRepository.getAllItems();
    }
}