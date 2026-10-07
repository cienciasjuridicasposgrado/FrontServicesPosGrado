import { InventoryEntriesRepository } from '../../../domain/repositories/inventory-entries.repository';
import { UpdateEntryUseCase } from './update-entry.usecase';

describe('UpdateEntryUseCase', () => {
  it('delegates the observation-only update', async () => {
    const repository = jasmine.createSpyObj<InventoryEntriesRepository>('InventoryEntriesRepository', [
      'getAllEntries', 'getEntryById', 'createEntry', 'updateEntry', 'deleteEntry'
    ]);
    const updated = {
      id: 4, itemCodigo: 'ABC', cantidad: 5, userCi: 123,
      fecha: new Date(), observacion: 'Corregida'
    };
    repository.updateEntry.and.resolveTo(updated);
    const useCase = new UpdateEntryUseCase(repository);

    await expectAsync(useCase.execute(4, { observacion: 'Corregida' })).toBeResolvedTo(updated);
    expect(repository.updateEntry).toHaveBeenCalledOnceWith(4, { observacion: 'Corregida' });
  });

  it('rejects unexpected runtime fields', async () => {
    const repository = jasmine.createSpyObj<InventoryEntriesRepository>('InventoryEntriesRepository', [
      'getAllEntries', 'getEntryById', 'createEntry', 'updateEntry', 'deleteEntry'
    ]);
    const useCase = new UpdateEntryUseCase(repository);

    await expectAsync(useCase.execute(4, {
      observacion: 'Corregida', cantidad: 10
    } as never)).toBeRejectedWithError(/Solo se permite actualizar/);
    expect(repository.updateEntry).not.toHaveBeenCalled();
  });
});
