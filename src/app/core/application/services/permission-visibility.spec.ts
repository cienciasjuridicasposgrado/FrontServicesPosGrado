import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DeleteEntryUseCase } from '../usecase/inventory-entries/delete-entry.usecase';
import { GetAllEntriesUseCase } from '../usecase/inventory-entries/get-all-entries.usecase';
import { DeleteOutputUseCase } from '../usecase/inventory-outputs/delete-output.usecase';
import { GetAllOutputsUseCase } from '../usecase/inventory-outputs/get-all-outputs.usecase';
import { DeleteItemUseCase } from '../usecase/items/delete-item.usecase';
import { GetAllItemsUseCase } from '../usecase/items/get-all-items.usecase';
import { DeleteUserUseCase } from '../usecase/users/delete-user.usecase';
import { GetAllUsersUseCase } from '../usecase/users/get-all-users.usecase';
import { Permission, PERMISSIONS } from '../../domain/models/permission.model';
import { EntriesListComponent } from '../../../modules/inventory/components/entries-list/entries-list.component';
import { OutputsListComponent } from '../../../modules/inventory/components/outputs-list/outputs-list.component';
import { ItemsListComponent } from '../../../modules/items/components/items-list/items-list.component';
import { LayoutComponent } from '../../../modules/dashboard/components/layout/layout.component';
import { UsersListComponent } from '../../../modules/users/components/users-list/users-list.component';
import { SealNumbersListComponent } from '../../../modules/seal-numbers/components/seal-numbers-list/seal-numbers-list.component';
import { GetAllSealNumbersUseCase } from '../usecase/seal-numbers/get-all-seal-numbers.usecase';
import { DeleteSealNumberUseCase } from '../usecase/seal-numbers/delete-seal-number.usecase';
import { NotificationService } from '../../../shared/services/notification.service';
import { AuthService } from './auth.service';
import { PermissionService } from './permission.service';

describe('permission-based template visibility', () => {
  let granted: Set<Permission>;
  let permissionService: Pick<PermissionService, 'has' | 'hasAll' | 'hasAny'>;

  beforeEach(() => {
    granted = new Set<Permission>();
    permissionService = {
      has: (permission) => granted.has(permission),
      hasAll: (permissions) => permissions.every((permission) => granted.has(permission)),
      hasAny: (permissions) => permissions.some((permission) => granted.has(permission))
    };
  });

  afterEach(() => TestBed.resetTestingModule());

  function buttonText(element: HTMLElement): string {
    return Array.from(element.querySelectorAll('button'))
      .map((button) => button.textContent?.replace(/\s+/g, ' ').trim() ?? '')
      .join(' | ');
  }

  it('requires canManageUsers and canManageRoles for Nuevo Usuario', async () => {
    granted.add(PERMISSIONS.manageUsers);
    await TestBed.configureTestingModule({
      imports: [UsersListComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: PermissionService, useValue: permissionService },
        { provide: GetAllUsersUseCase, useValue: { execute: () => Promise.resolve([]) } },
        { provide: DeleteUserUseCase, useValue: { execute: () => Promise.resolve() } },
        { provide: NotificationService, useValue: {} }
      ]
    }).compileComponents();
    const fixture = TestBed.createComponent(UsersListComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(buttonText(fixture.nativeElement)).not.toContain('Nuevo usuario');

    granted.add(PERMISSIONS.manageRoles);
    fixture.detectChanges();
    expect(buttonText(fixture.nativeElement)).toContain('Nuevo usuario');
  });

  it('hides the Roles navigation option without canManageRoles', async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: PermissionService, useValue: permissionService },
        {
          provide: AuthService,
          useValue: { currentUser$: of(null), logout: jasmine.createSpy('logout') }
        }
      ]
    }).compileComponents();
    const fixture = TestBed.createComponent(LayoutComponent);
    fixture.detectChanges();
    const navigation = fixture.nativeElement.querySelector('.side-nav') as HTMLElement;
    expect(navigation.textContent).not.toContain('Roles');
    expect(navigation.textContent).toContain('Departamentos');

    granted.add(PERMISSIONS.manageRoles);
    fixture.detectChanges();
    expect(navigation.textContent).toContain('Roles');
  });

  it('hides Item create, edit and delete actions without canManageCatalog', async () => {
    const notification = {};
    await TestBed.configureTestingModule({
      imports: [ItemsListComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: PermissionService, useValue: permissionService },
        { provide: GetAllItemsUseCase, useValue: { execute: () => Promise.resolve([{ codigo: 'A', nombreItem: 'Papel', stock: 10, unidad: 'u' }]) } },
        { provide: DeleteItemUseCase, useValue: { execute: () => Promise.resolve() } }
      ]
    })
      .overrideComponent(ItemsListComponent, {
        set: { providers: [{ provide: NotificationService, useValue: notification }] }
      })
      .compileComponents();
    const fixture = TestBed.createComponent(ItemsListComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = buttonText(fixture.nativeElement);
    expect(text).not.toContain('Nuevo ítem');
    expect(text).not.toContain('edit');
    expect(text).not.toContain('delete');
  });

  it('hides Entry create and annul actions without canMakeEntry', async () => {
    await TestBed.configureTestingModule({
      imports: [EntriesListComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: PermissionService, useValue: permissionService },
        { provide: GetAllEntriesUseCase, useValue: { execute: () => Promise.resolve([{ id: 1, itemCodigo: 'A', cantidad: 1, userCi: 1, fecha: new Date(), observacion: '' }]) } },
        { provide: DeleteEntryUseCase, useValue: { execute: () => Promise.resolve() } }
      ]
    })
      .overrideComponent(EntriesListComponent, {
        set: { providers: [{ provide: NotificationService, useValue: {} }] }
      })
      .compileComponents();
    const fixture = TestBed.createComponent(EntriesListComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = buttonText(fixture.nativeElement);
    expect(text).not.toContain('Registrar entrada');
    expect(text).not.toContain('cancel');
    expect(text).toContain('visibility');
  });

  it('hides Output create and annul actions without canMakeOutput', async () => {
    await TestBed.configureTestingModule({
      imports: [OutputsListComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: PermissionService, useValue: permissionService },
        { provide: GetAllOutputsUseCase, useValue: { execute: () => Promise.resolve([{ id: 1, itemCodigo: 'A', cantidad: 1, userCi: 1, departamentoId: 1, fecha: new Date() }]) } },
        { provide: DeleteOutputUseCase, useValue: { execute: () => Promise.resolve() } },
        { provide: NotificationService, useValue: {} }
      ]
    }).compileComponents();
    const fixture = TestBed.createComponent(OutputsListComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = buttonText(fixture.nativeElement);
    expect(text).not.toContain('Registrar salida');
    expect(text).not.toContain('cancel');
    expect(text).toContain('visibility');
  });

  it('documents that Sellos can open with canGenerateSeals while its user lookup requires canManageUsers', async () => {
    granted.add(PERMISSIONS.generateSeals);
    await TestBed.configureTestingModule({
      imports: [SealNumbersListComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: PermissionService, useValue: permissionService },
        { provide: GetAllSealNumbersUseCase, useValue: { execute: () => Promise.resolve([]) } },
        { provide: DeleteSealNumberUseCase, useValue: { execute: () => Promise.resolve() } }
      ]
    })
      .overrideComponent(SealNumbersListComponent, {
        set: { providers: [{ provide: NotificationService, useValue: {} }] }
      })
      .compileComponents();
    const fixture = TestBed.createComponent(SealNumbersListComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(permissionService.has(PERMISSIONS.generateSeals)).toBeTrue();
    expect(permissionService.has(PERMISSIONS.manageUsers)).toBeFalse();
    expect(buttonText(fixture.nativeElement)).toContain('Nuevo sello');
  });
});
