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

export interface CreateInventoryOutputModel {
    itemCodigo: string;
    cantidad: number;
    userCi: number;
    departamentoId: number;
    observacion?: string;
}

export interface UpdateInventoryOutputModel {
    observacion: string;
}
