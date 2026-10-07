import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { GetAllRolesUseCase } from '../../../../core/application/usecase/roles/get-all-roles.usecase';
import { AuthService } from '../../../../core/application/services/auth.service';
import { PermissionService } from '../../../../core/application/services/permission.service';
import { ChangeUserRoleUseCase } from '../../../../core/application/usecase/users/change-user-role.usecase';
import { CreateUserUseCase } from '../../../../core/application/usecase/users/create-user.usecase';
import { GetUserByCiUseCase } from '../../../../core/application/usecase/users/get-user-by-ci.usecase';
import { UpdateUserUseCase } from '../../../../core/application/usecase/users/update-user.usecase';
import { Permission, PERMISSIONS } from '../../../../core/domain/models/permission.model';
import { RoleModel } from '../../../../core/domain/models/role.model';
import { UserModel } from '../../../../core/domain/models/user.model';
import { NotificationService } from '../../../../shared/services/notification.service';
import { UserFormComponent } from './user-form.component';

describe('UserFormComponent', () => {
  const roles: RoleModel[] = [
    {
      id: 1,
      name: 'Administrador',
      description: 'Admin',
      canMakeEntry: true,
      canMakeOutput: true,
      canManageUsers: true,
      canManageRoles: true,
      canManageCatalog: true,
      canGenerateSeals: true,
      canGenerateLetters: true
    },
    {
      id: 2,
      name: 'Operador',
      description: 'Operador',
      canMakeEntry: false,
      canMakeOutput: false,
      canManageUsers: false,
      canManageRoles: false,
      canManageCatalog: false,
      canGenerateSeals: false,
      canGenerateLetters: false
    }
  ];
  const user: UserModel = { ci: 1234567, nombre: 'Ada Lovelace', roleId: 1, role: roles[0] };

  let granted: Set<Permission>;
  let createUser: jasmine.SpyObj<CreateUserUseCase>;
  let updateUser: jasmine.SpyObj<UpdateUserUseCase>;
  let changeRole: jasmine.SpyObj<ChangeUserRoleUseCase>;
  let getUser: jasmine.SpyObj<GetUserByCiUseCase>;
  let getRoles: jasmine.SpyObj<GetAllRolesUseCase>;
  let authService: jasmine.SpyObj<AuthService>;
  let notification: jasmine.SpyObj<NotificationService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    granted = new Set<Permission>();
    createUser = jasmine.createSpyObj<CreateUserUseCase>('CreateUserUseCase', ['execute']);
    updateUser = jasmine.createSpyObj<UpdateUserUseCase>('UpdateUserUseCase', ['execute']);
    changeRole = jasmine.createSpyObj<ChangeUserRoleUseCase>('ChangeUserRoleUseCase', ['execute']);
    getUser = jasmine.createSpyObj<GetUserByCiUseCase>('GetUserByCiUseCase', ['execute']);
    getRoles = jasmine.createSpyObj<GetAllRolesUseCase>('GetAllRolesUseCase', ['execute']);
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['getCurrentUser', 'refreshProfile']);
    notification = jasmine.createSpyObj<NotificationService>('NotificationService', [
      'showSuccess',
      'showError',
      'showWarning'
    ]);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    router.navigate.and.resolveTo(true);
    getRoles.execute.and.resolveTo(roles);
    getUser.execute.and.resolveTo(user);
    authService.getCurrentUser.and.returnValue(null);
  });

  afterEach(() => TestBed.resetTestingModule());

  async function render(ci?: number): Promise<{
    fixture: ComponentFixture<UserFormComponent>;
    component: UserFormComponent;
  }> {
    const permissionService: Pick<PermissionService, 'has' | 'hasAll' | 'hasAny'> = {
      has: (permission) => granted.has(permission),
      hasAll: (permissions) => permissions.every((permission) => granted.has(permission)),
      hasAny: (permissions) => permissions.some((permission) => granted.has(permission))
    };

    await TestBed.configureTestingModule({
      imports: [UserFormComponent, NoopAnimationsModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap(ci ? { ci } : {}) } }
        },
        { provide: Router, useValue: router },
        { provide: NotificationService, useValue: notification },
        { provide: CreateUserUseCase, useValue: createUser },
        { provide: UpdateUserUseCase, useValue: updateUser },
        { provide: ChangeUserRoleUseCase, useValue: changeRole },
        { provide: GetUserByCiUseCase, useValue: getUser },
        { provide: GetAllRolesUseCase, useValue: getRoles },
        { provide: AuthService, useValue: authService },
        { provide: PermissionService, useValue: permissionService }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(UserFormComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance };
  }

  it('creates with both permissions, loads roles, shows the selector and sends numeric role_id', async () => {
    granted.add(PERMISSIONS.manageUsers);
    granted.add(PERMISSIONS.manageRoles);
    createUser.execute.and.resolveTo(user);
    const { fixture, component } = await render();

    expect(getRoles.execute).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.querySelectorAll('mat-select').length).toBe(1);

    component.userForm.patchValue({
      ci: 1234567,
      nombre: 'Ada Lovelace',
      password: 'password'
    });
    component.roleForm.patchValue({ role_id: 2 });
    await component.onSubmit();

    expect(createUser.execute).toHaveBeenCalledOnceWith({
      ci: 1234567,
      nombre: 'Ada Lovelace',
      password: 'password',
      role_id: 2
    });
    expect(typeof createUser.execute.calls.mostRecent().args[0].role_id).toBe('number');
  });

  it('fails closed when the create component is instantiated without both permissions', async () => {
    granted.add(PERMISSIONS.manageUsers);
    const { fixture, component } = await render();

    expect(component.accessDenied).toBeTrue();
    expect(getRoles.execute).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('mat-select')).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard/forbidden']);

    await component.onSubmit();
    expect(createUser.execute).not.toHaveBeenCalled();
  });

  it('lets canManageUsers-only actors edit general data without loading or exposing roles', async () => {
    granted.add(PERMISSIONS.manageUsers);
    updateUser.execute.and.resolveTo({ ...user, nombre: 'Ada Byron' });
    const { fixture, component } = await render(user.ci);

    expect(getUser.execute).toHaveBeenCalledOnceWith(user.ci);
    expect(getRoles.execute).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('mat-select')).toBeNull();

    component.userForm.patchValue({ nombre: 'Ada Byron', password: '' });
    await component.onSubmit();

    expect(updateUser.execute).toHaveBeenCalledOnceWith(user.ci, { nombre: 'Ada Byron' });
    expect(changeRole.execute).not.toHaveBeenCalled();
  });

  it('keeps general and role updates independent when both permissions are present', async () => {
    granted.add(PERMISSIONS.manageUsers);
    granted.add(PERMISSIONS.manageRoles);
    const roleChangedUser = { ...user, roleId: 2, role: roles[1] };
    getUser.execute.and.returnValues(Promise.resolve(user), Promise.resolve(roleChangedUser));
    updateUser.execute.and.resolveTo({ ...user, nombre: 'Ada Byron' });
    changeRole.execute.and.resolveTo(roleChangedUser);
    const { fixture, component } = await render(user.ci);

    expect(getRoles.execute).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.querySelectorAll('mat-select').length).toBe(1);

    component.userForm.patchValue({ nombre: 'Ada Byron', password: '' });
    await component.onSubmit();
    expect(updateUser.execute).toHaveBeenCalledOnceWith(user.ci, { nombre: 'Ada Byron' });
    expect(changeRole.execute).not.toHaveBeenCalled();

    await component.onChangeRole();
    expect(changeRole.execute).not.toHaveBeenCalled();

    component.roleForm.patchValue({ role_id: 2 });
    await component.onChangeRole();
    expect(changeRole.execute).toHaveBeenCalledOnceWith(user.ci, { role_id: 2 });
    expect(getUser.execute).toHaveBeenCalledTimes(2);
    expect(component.initialRoleId).toBe(2);
  });

  it('refreshes profile after changing its own role and leaves Users when permission is lost', async () => {
    granted.add(PERMISSIONS.manageUsers);
    granted.add(PERMISSIONS.manageRoles);
    const demotedUser = { ...user, roleId: 2, role: roles[1] };
    authService.getCurrentUser.and.returnValue(user);
    authService.refreshProfile.and.callFake(() => {
      granted.delete(PERMISSIONS.manageUsers);
      granted.delete(PERMISSIONS.manageRoles);
      return of(demotedUser);
    });
    changeRole.execute.and.resolveTo(demotedUser);
    const { component } = await render(user.ci);

    component.roleForm.patchValue({ role_id: 2 });
    await component.onChangeRole();

    expect(changeRole.execute).toHaveBeenCalledOnceWith(user.ci, { role_id: 2 });
    expect(authService.refreshProfile).toHaveBeenCalledTimes(1);
    expect(getUser.execute).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});
