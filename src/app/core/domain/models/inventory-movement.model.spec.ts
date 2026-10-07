import { UpdateInventoryEntryModel } from './inventory-entry.model';
import { UpdateInventoryOutputModel } from './inventory-output.model';

describe('Inventory movement update DTOs', () => {
  it('limits Entry update to observacion', () => {
    type Keys = keyof UpdateInventoryEntryModel;
    const key: Keys = 'observacion';
    const update: UpdateInventoryEntryModel = { observacion: 'Corregida' };

    expect(key).toBe('observacion');
    expect(Object.keys(update)).toEqual(['observacion']);
  });

  it('limits Output update to observacion', () => {
    type Keys = keyof UpdateInventoryOutputModel;
    const key: Keys = 'observacion';
    const update: UpdateInventoryOutputModel = { observacion: 'Corregida' };

    expect(key).toBe('observacion');
    expect(Object.keys(update)).toEqual(['observacion']);
  });
});
