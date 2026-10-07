import { InventoryOutputsRepository } from '../../../domain/repositories/inventory-outputs.repository';
import { ItemsRepository } from '../../../domain/repositories/items.repository';
import { CreateOutputUseCase } from './create-output.usecase';

describe('CreateOutputUseCase', () => {
  let outputsRepository: jasmine.SpyObj<InventoryOutputsRepository>;
  let itemsRepository: jasmine.SpyObj<ItemsRepository>;
  let useCase: CreateOutputUseCase;

  beforeEach(() => {
    outputsRepository = jasmine.createSpyObj<InventoryOutputsRepository>('InventoryOutputsRepository', [
      'getAllOutputs', 'getOutputById', 'createOutput', 'updateOutput', 'deleteOutput'
    ]);
    itemsRepository = jasmine.createSpyObj<ItemsRepository>('ItemsRepository', [
      'getAllItems', 'getItemByCodigo', 'createItem', 'updateItem', 'deleteItem'
    ]);
    useCase = new CreateOutputUseCase(outputsRepository, itemsRepository);
  });

  for (const cantidad of [1.5, 0, 10_001]) {
    it(`rejects invalid programmatic cantidad ${cantidad} before the stock precheck`, async () => {
      await expectAsync(useCase.execute({
        itemCodigo: 'ABC', cantidad, departamentoId: 9, observacion: ''
      })).toBeRejectedWithError(/entero entre 1 y 10000/);
      expect(itemsRepository.getItemByCodigo).not.toHaveBeenCalled();
      expect(outputsRepository.createOutput).not.toHaveBeenCalled();
    });
  }
});
