import { ItemModel, CreateItemModel, UpdateItemModel } from "../models/item.model";

export abstract class ItemsRepository {

    abstract getAllItems(): Promise<ItemModel[]>;

    abstract getItemByCodigo(codigo: string): Promise<ItemModel>;

    abstract createItem(item: CreateItemModel): Promise<ItemModel>;

    abstract updateItem(codigo: string, item: UpdateItemModel): Promise<ItemModel>;

    abstract deleteItem(codigo: string): Promise<void>;
}