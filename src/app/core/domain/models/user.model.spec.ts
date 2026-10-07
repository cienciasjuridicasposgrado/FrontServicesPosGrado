import { ChangeUserRoleModel, CreateUserModel, UpdateUserModel } from './user.model';

describe('user write models', () => {
  it('keeps role_id in the create contract', () => {
    const create: CreateUserModel = {
      ci: 1234567,
      nombre: 'Ada Lovelace',
      password: 'password',
      role_id: 2
    };

    expect(create.role_id).toBe(2);
  });

  it('excludes role_id from the general update contract', () => {
    type UpdateHasRoleId = 'role_id' extends keyof UpdateUserModel ? true : false;
    type RoleChangeFitsGeneralUpdate = ChangeUserRoleModel extends UpdateUserModel ? true : false;
    const updateHasRoleId: UpdateHasRoleId = false;
    const roleChangeFitsGeneralUpdate: RoleChangeFitsGeneralUpdate = false;
    const update: UpdateUserModel = { nombre: 'Ada Byron' };

    expect(updateHasRoleId).toBeFalse();
    expect(roleChangeFitsGeneralUpdate).toBeFalse();
    expect(update).toEqual({ nombre: 'Ada Byron' });
  });

  it('requires role_id in the dedicated role-change contract', () => {
    const change: ChangeUserRoleModel = { role_id: 3 };
    expect(change).toEqual({ role_id: 3 });
  });
});
