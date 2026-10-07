import { HttpErrorResponse } from '@angular/common/http';
import { InventoryOutputsRepository } from '../../../domain/repositories/inventory-outputs.repository';
import { DeleteOutputUseCase } from './delete-output.usecase';

describe('DeleteOutputUseCase', () => {
  it('preserves a structured inventory error from the repository', async () => {
    const repository = jasmine.createSpyObj<InventoryOutputsRepository>('InventoryOutputsRepository', [
      'getAllOutputs', 'getOutputById', 'createOutput', 'updateOutput', 'deleteOutput'
    ]);
    const error = new HttpErrorResponse({
      status: 403,
      error: { message: 'La salida no puede anularse en el estado actual.' }
    });
    repository.deleteOutput.and.rejectWith(error);
    const useCase = new DeleteOutputUseCase(repository);

    await expectAsync(useCase.execute(5)).toBeRejectedWith(error);
  });
});
