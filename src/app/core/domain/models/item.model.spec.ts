import { CreateItemModel, UpdateItemModel } from './item.model';

describe('Item write DTOs', () => {
  it('keeps the create DTO limited to codigo, nombreItem and unidad', () => {
    type HasStock = 'stock' extends keyof CreateItemModel ? true : false;
    const hasStock: HasStock = false;
    const item: CreateItemModel = { codigo: 'ABC', nombreItem: 'Papel', unidad: 'paq' };

    expect(hasStock).toBeFalse();
    expect(Object.keys(item)).toEqual(['codigo', 'nombreItem', 'unidad']);
  });

  it('keeps the update DTO limited to editable metadata', () => {
    type HasStock = 'stock' extends keyof UpdateItemModel ? true : false;
    type HasCodigo = 'codigo' extends keyof UpdateItemModel ? true : false;
    const hasStock: HasStock = false;
    const hasCodigo: HasCodigo = false;

    expect(hasStock).toBeFalse();
    expect(hasCodigo).toBeFalse();
  });
});
