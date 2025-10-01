import { DepartamentoModel } from "./departamento.model";
import { ItemModel } from "./item.model";
import { UserModel } from "./user.model";

export interface InventoryOutputModel {
    id: number;
    itemCodigo: string;
    cantidad: number;
    userCi: number;
    departamentoId: number;
    fecha: Date;
    observacion?: string;

    item?: ItemModel;
    user?: UserModel;
    departamento?: DepartamentoModel;
}

export interface CreateInventoryOutputModel extends Omit<InventoryOutputModel, 'id' | 'fecha' | 'item' | 'user' | 'departamento'> {}

export interface UpdateInventoryOutputModel extends Partial<Omit<InventoryOutputModel, 'id' | 'itemCodigo' | 'userCi' | 'departamentoId' | 'cantidad' | 'fecha' | 'item' | 'user' | 'departamento'>> {}