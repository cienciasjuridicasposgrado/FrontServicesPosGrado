import { Injectable } from '@angular/core';
import { ItemsImportConfirmResponse } from '../../../domain/models/item-import.model';
import { ItemsRepository } from '../../../domain/repositories/items.repository';

@Injectable({ providedIn: 'root' })
export class ConfirmItemsImportUseCase {
    constructor(private readonly itemsRepository: ItemsRepository) {}

    execute(file: File, expectedHash: string): Promise<ItemsImportConfirmResponse> {
        if (!expectedHash.trim()) {
            throw new Error('La previsualización no contiene un hash de archivo válido.');
        }

        return this.itemsRepository.confirmItemsImport(file, expectedHash);
    }
}
