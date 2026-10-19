import { ItemModel, CreateItemModel, UpdateItemModel } from "../models/item.model";
import { ItemsImportConfirmResponse, ItemsImportPreviewResponse } from "../models/item-import.model";

export abstract class ItemsRepository {

    abstract getAllItems(): Promise<ItemModel[]>;

    abstract getItemByCodigo(codigo: string): Promise<ItemModel>;

    abstract createItem(item: CreateItemModel): Promise<ItemModel>;

    abstract updateItem(codigo: string, item: UpdateItemModel): Promise<ItemModel>;

    abstract deleteItem(codigo: string): Promise<void>;

    abstract previewItemsImport(file: File): Promise<ItemsImportPreviewResponse>;

    abstract confirmItemsImport(file: File, expectedHash: string): Promise<ItemsImportConfirmResponse>;
}
