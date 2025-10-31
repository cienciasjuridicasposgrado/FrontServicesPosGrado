import { Injectable } from "@angular/core";
import { ItemsRepository } from "../../../domain/repositories/items.repository";

@Injectable({ 
    providedIn: 'root' 
})
export class DeleteItemUseCase {
    constructor(private itemsRepository: ItemsRepository) {}

    async execute(codigo: string): Promise<void> {
        return this.itemsRepository.deleteItem(codigo);
    }
}