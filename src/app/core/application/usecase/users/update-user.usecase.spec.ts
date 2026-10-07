import { UserModel } from '../../../domain/models/user.model';
import { UsersRepository } from '../../../domain/repositories/users.repository';
import { UpdateUserUseCase } from './update-user.usecase';

describe('UpdateUserUseCase', () => {
  let repository: jasmine.SpyObj<UsersRepository>;
  let useCase: UpdateUserUseCase;

  beforeEach(() => {
    repository = jasmine.createSpyObj<UsersRepository>('UsersRepository', [
      'getAllUsers',
      'getUserByCi',
      'createUser',
      'updateUser',
      'updateUserRole',
      'deleteUser'
    ]);
    useCase = new UpdateUserUseCase(repository);
  });

  it('delegates only the explicit general-update DTO', async () => {
    const updated: UserModel = { ci: 1234567, nombre: 'Ada Byron', roleId: 2 };
    repository.updateUser.and.resolveTo(updated);

    await expectAsync(useCase.execute(1234567, { nombre: 'Ada Byron' }))
      .toBeResolvedTo(updated);
    expect(repository.updateUser).toHaveBeenCalledOnceWith(1234567, {
      nombre: 'Ada Byron'
    });
    expect(repository.updateUserRole).not.toHaveBeenCalled();
  });

  it('rejects an empty general update', async () => {
    await expectAsync(useCase.execute(1234567, {}))
      .toBeRejectedWithError(/No se proporcionaron campos/);
    expect(repository.updateUser).not.toHaveBeenCalled();
  });

  it('has no role_id in the payload accepted by execute', () => {
    type UpdatePayload = Parameters<UpdateUserUseCase['execute']>[1];
    type HasRoleId = 'role_id' extends keyof UpdatePayload ? true : false;
    const hasRoleId: HasRoleId = false;

    expect(hasRoleId).toBeFalse();
  });
});
