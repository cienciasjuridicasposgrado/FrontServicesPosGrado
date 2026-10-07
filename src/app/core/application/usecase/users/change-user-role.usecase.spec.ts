import { UserModel } from '../../../domain/models/user.model';
import { UsersRepository } from '../../../domain/repositories/users.repository';
import { ChangeUserRoleUseCase } from './change-user-role.usecase';

describe('ChangeUserRoleUseCase', () => {
  let repository: jasmine.SpyObj<UsersRepository>;
  let useCase: ChangeUserRoleUseCase;

  beforeEach(() => {
    repository = jasmine.createSpyObj<UsersRepository>('UsersRepository', [
      'getAllUsers',
      'getUserByCi',
      'createUser',
      'updateUser',
      'updateUserRole',
      'deleteUser'
    ]);
    useCase = new ChangeUserRoleUseCase(repository);
  });

  it('delegates exclusively to the dedicated role operation', async () => {
    const updated: UserModel = { ci: 1234567, nombre: 'Ada', roleId: 4 };
    repository.updateUserRole.and.resolveTo(updated);

    await expectAsync(useCase.execute(1234567, { role_id: 4 })).toBeResolvedTo(updated);
    expect(repository.updateUserRole).toHaveBeenCalledOnceWith(1234567, { role_id: 4 });
    expect(repository.updateUser).not.toHaveBeenCalled();
  });

  it('rejects invalid CI and role identifiers before calling the repository', async () => {
    await expectAsync(useCase.execute(123, { role_id: 2 })).toBeRejected();
    await expectAsync(useCase.execute(1234567, { role_id: 0 })).toBeRejected();
    await expectAsync(useCase.execute(1234567, { role_id: 1.5 })).toBeRejected();
    expect(repository.updateUserRole).not.toHaveBeenCalled();
  });
});
