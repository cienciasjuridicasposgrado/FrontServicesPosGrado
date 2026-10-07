import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CreateRoleUseCase } from '../../../../core/application/usecase/roles/create-role.usecase';
import { GetRoleByIdUseCase } from '../../../../core/application/usecase/roles/get-role-by-id.usecase';
import { UpdateRoleUseCase } from '../../../../core/application/usecase/roles/update-role.usecase';
import { RoleModel } from '../../../../core/domain/models/role.model';
import { NotificationService } from '../../../../shared/services/notification.service';
import { RoleFormComponent } from './role-form.component';

describe('RoleFormComponent permissions', () => {
  it('defines and patches all seven camelCase permissions', async () => {
    const role: RoleModel = {
      id: 7,
      name: 'Operaciones',
      description: null,
      canMakeEntry: true,
      canMakeOutput: false,
      canManageUsers: true,
      canManageRoles: false,
      canManageCatalog: true,
      canGenerateSeals: false,
      canGenerateLetters: true
    };
    const getRole = jasmine.createSpyObj<GetRoleByIdUseCase>('GetRoleByIdUseCase', ['execute']);
    getRole.execute.and.resolveTo(role);
    const component = new RoleFormComponent(
      new FormBuilder(),
      jasmine.createSpyObj<Router>('Router', ['navigate']),
      { snapshot: { paramMap: { get: () => null } } } as unknown as ActivatedRoute,
      jasmine.createSpyObj<NotificationService>('NotificationService', ['showError', 'showSuccess', 'showWarning']),
      jasmine.createSpyObj<CreateRoleUseCase>('CreateRoleUseCase', ['execute']),
      jasmine.createSpyObj<UpdateRoleUseCase>('UpdateRoleUseCase', ['execute']),
      getRole
    );

    await component.loadRoleData(role.id);

    expect(component.roleForm.value).toEqual({
      name: 'Operaciones',
      description: null,
      canMakeEntry: true,
      canMakeOutput: false,
      canManageUsers: true,
      canManageRoles: false,
      canManageCatalog: true,
      canGenerateSeals: false,
      canGenerateLetters: true
    });
  });
});
