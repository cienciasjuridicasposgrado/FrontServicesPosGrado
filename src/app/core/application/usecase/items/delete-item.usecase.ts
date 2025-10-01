import { Injectable } from "@angular/core";
import { ItemsRepository } from "../../../domain/repositories/items.repository";

@Injectable({ 
    providedIn: 'root' 
})
export class DeleteItemUseCase {
    constructor(private itemsRepository: ItemsRepository) {}

    async execute(codigo: string): Promise<void> {
        const item = await this.itemsRepository.getItemByCodigo(codigo);
        if (item.stock > 0) {
            throw new Error("No se puede eliminar un item con stock activo.");
        }
        return this.itemsRepository.deleteItem(codigo);
    }
}