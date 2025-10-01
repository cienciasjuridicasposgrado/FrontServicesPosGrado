export interface ItemModel {
    codigo: string;
    nombreItem: string;
    stock: number;
    unidad: string;
}

export interface CreateItemModel extends Omit<ItemModel, 'stock'> {}

export interface UpdateItemModel extends Partial<Omit<ItemModel, 'codigo' | 'stock'>> {}