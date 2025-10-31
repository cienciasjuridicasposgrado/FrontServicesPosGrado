export interface ItemModel {
    codigo: string;
    nombreItem: string;
    stock: number;
    unidad: string;
}

export interface CreateItemModel extends ItemModel {}

export interface UpdateItemModel extends ItemModel {}