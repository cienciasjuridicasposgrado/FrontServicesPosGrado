import { InventoryEntriesRepository } from '../../../domain/repositories/inventory-entries.repository';
import { CreateEntryUseCase } from './create-entry.usecase';

describe('CreateEntryUseCase', () => {
  let repository: jasmine.SpyObj<InventoryEntriesRepository>;
  let useCase: CreateEntryUseCase;

  beforeEach(() => {
    repository = jasmine.createSpyObj<InventoryEntriesRepository>('InventoryEntriesRepository', [
      'getAllEntries', 'getEntryById', 'createEntry', 'updateEntry', 'deleteEntry'
    ]);
    useCase = new CreateEntryUseCase(repository);
  });

  for (const cantidad of [1.5, 0, 10_001]) {
    it(`rejects invalid programmatic cantidad ${cantidad}`, async () => {
      await expectAsync(useCase.execute({
        itemCodigo: 'ABC', cantidad, userCi: 123, observacion: ''
      })).toBeRejectedWithError(/entero entre 1 y 10000/);
      expect(repository.createEntry).not.toHaveBeenCalled();
    });
  }
});
