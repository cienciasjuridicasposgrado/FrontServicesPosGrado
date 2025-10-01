import { InventoryEntryModel, CreateInventoryEntryModel, UpdateInventoryEntryModel } from "../models/inventory-entry.model";

export abstract class InventoryEntriesRepository {
    abstract getAllEntries(): Promise<InventoryEntryModel[]>;

    abstract getEntryById(id: number): Promise<InventoryEntryModel>;

    abstract createEntry(entry: CreateInventoryEntryModel): Promise<InventoryEntryModel>;

    abstract updateEntry(id: number, entry: UpdateInventoryEntryModel): Promise<InventoryEntryModel>;

    abstract deleteEntry(id: number): Promise<void>;
}