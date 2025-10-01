import { Injectable } from "@angular/core";
import { ItemModel } from "../../../domain/models/item.model";
import { ItemsRepository } from "../../../domain/repositories/items.repository";

@Injectable({ 
    providedIn: 'root' 
})
export class GetItemByCodigoUseCase {
    constructor(private itemsRepository: ItemsRepository) {}

    execute(codigo: string): Promise<ItemModel> {
        const normalizedCodigo = codigo.toUpperCase();
        return this.itemsRepository.getItemByCodigo(normalizedCodigo);
    }
}