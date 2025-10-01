import { ItemModel } from "./item.model";
import { UserModel } from "./user.model";

export interface InventoryEntryModel {
    id: number;
    itemCodigo: string;
    cantidad: number;
    userCi: number;
    fecha: Date;
    observacion: string;

    item?: ItemModel;
    user?: UserModel;
}

export interface CreateInventoryEntryModel extends Omit<InventoryEntryModel, 'id' | 'fecha' | 'item' | 'user'> {}

export interface UpdateInventoryEntryModel extends Partial<Omit<CreateInventoryEntryModel, 'itemCodigo' | 'userCi'>> {}