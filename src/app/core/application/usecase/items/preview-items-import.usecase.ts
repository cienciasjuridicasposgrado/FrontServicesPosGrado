import { Injectable } from '@angular/core';
import { ItemsImportPreviewResponse } from '../../../domain/models/item-import.model';
import { ItemsRepository } from '../../../domain/repositories/items.repository';

@Injectable({ providedIn: 'root' })
export class PreviewItemsImportUseCase {
    constructor(private readonly itemsRepository: ItemsRepository) {}

    execute(file: File): Promise<ItemsImportPreviewResponse> {
        return this.itemsRepository.previewItemsImport(file);
    }
}
