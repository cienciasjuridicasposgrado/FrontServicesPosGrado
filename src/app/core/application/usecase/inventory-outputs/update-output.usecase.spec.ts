import { InventoryOutputsRepository } from '../../../domain/repositories/inventory-outputs.repository';
import { UpdateOutputUseCase } from './update-output.usecase';

describe('UpdateOutputUseCase', () => {
  it('delegates the observation-only update', async () => {
    const repository = jasmine.createSpyObj<InventoryOutputsRepository>('InventoryOutputsRepository', [
      'getAllOutputs', 'getOutputById', 'createOutput', 'updateOutput', 'deleteOutput'
    ]);
    const updated = {
      id: 4, itemCodigo: 'ABC', cantidad: 5, userCi: 123, departamentoId: 9,
      fecha: new Date(), observacion: 'Corregida'
    };
    repository.updateOutput.and.resolveTo(updated);
    const useCase = new UpdateOutputUseCase(repository);

    await expectAsync(useCase.execute(4, { observacion: 'Corregida' })).toBeResolvedTo(updated);
    expect(repository.updateOutput).toHaveBeenCalledOnceWith(4, { observacion: 'Corregida' });
  });

  it('rejects unexpected runtime fields', async () => {
    const repository = jasmine.createSpyObj<InventoryOutputsRepository>('InventoryOutputsRepository', [
      'getAllOutputs', 'getOutputById', 'createOutput', 'updateOutput', 'deleteOutput'
    ]);
    const useCase = new UpdateOutputUseCase(repository);

    await expectAsync(useCase.execute(4, {
      observacion: 'Corregida', cantidad: 10
    } as never)).toBeRejectedWithError(/Solo se permite actualizar/);
    expect(repository.updateOutput).not.toHaveBeenCalled();
  });
});
