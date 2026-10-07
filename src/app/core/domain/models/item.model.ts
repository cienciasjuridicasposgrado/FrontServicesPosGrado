export interface ItemModel {
    codigo: string;
    nombreItem: string;
    stock: number;
    unidad: string;
}

export interface CreateItemModel {
    codigo: string;
    nombreItem: string;
    unidad: string;
}

export interface UpdateItemModel {
    nombreItem?: string;
    unidad?: string;
}
