import { ItemsRepository } from '../../../domain/repositories/items.repository';
import { CreateItemUseCase } from './create-item.usecase';
import { UpdateItemUseCase } from './update-item.usecase';

describe('Item write use cases', () => {
  let repository: jasmine.SpyObj<ItemsRepository>;

  beforeEach(() => {
    repository = jasmine.createSpyObj<ItemsRepository>('ItemsRepository', [
      'getAllItems', 'getItemByCodigo', 'createItem', 'updateItem', 'deleteItem'
    ]);
  });

  it('creates an Item without requiring stock', async () => {
    const created = { codigo: 'ABC', nombreItem: 'Papel', stock: 0, unidad: 'paq' };
    repository.createItem.and.resolveTo(created);
    const useCase = new CreateItemUseCase(repository);

    await expectAsync(useCase.execute({
      codigo: ' abc ', nombreItem: 'Papel', unidad: 'paq'
    })).toBeResolvedTo(created);
    expect(repository.createItem).toHaveBeenCalledOnceWith({
      codigo: 'ABC', nombreItem: 'Papel', unidad: 'paq'
    });
  });

  it('separates the route codigo and strips forbidden runtime fields from update', async () => {
    const updated = { codigo: 'ABC', nombreItem: 'Papel carta', stock: 15, unidad: 'caja' };
    repository.updateItem.and.resolveTo(updated);
    const useCase = new UpdateItemUseCase(repository);

    await useCase.execute('ABC', {
      codigo: 'OTRO', stock: 999, nombreItem: 'Papel carta', unidad: 'caja'
    } as never);

    expect(repository.updateItem).toHaveBeenCalledOnceWith('ABC', {
      nombreItem: 'Papel carta', unidad: 'caja'
    });
  });
});
