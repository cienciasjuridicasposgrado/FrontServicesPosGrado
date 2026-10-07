import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { RoleModel } from '../../domain/models/role.model';
import { UserModel } from '../../domain/models/user.model';
import { PERMISSIONS } from '../../domain/models/permission.model';
import { AuthService, SessionState } from './auth.service';
import { PermissionService } from './permission.service';

describe('PermissionService', () => {
  let currentUser$: BehaviorSubject<UserModel | null>;
  let sessionState$: BehaviorSubject<SessionState>;
  let service: PermissionService;

  const role = (overrides: Partial<RoleModel> = {}): RoleModel => ({
    id: 1,
    name: 'Rol cualquiera',
    description: null,
    canMakeEntry: false,
    canMakeOutput: false,
    canManageUsers: false,
    canManageRoles: false,
    canManageCatalog: false,
    canGenerateSeals: false,
    canGenerateLetters: false,
    ...overrides
  });

  const user = (userRole?: RoleModel | null): UserModel => ({
    ci: 123,
    nombre: 'Ada',
    role_id: 1,
    role: userRole
  });

  beforeEach(() => {
    currentUser$ = new BehaviorSubject<UserModel | null>(null);
    sessionState$ = new BehaviorSubject<SessionState>('authenticated');
    TestBed.configureTestingModule({
      providers: [
        PermissionService,
        {
          provide: AuthService,
          useValue: {
            currentUser$: currentUser$.asObservable(),
            sessionState$: sessionState$.asObservable()
          }
        }
      ]
    });
    service = TestBed.inject(PermissionService);
  });

  it('fails closed without a user', () => {
    expect(service.has(PERMISSIONS.makeEntry)).toBeFalse();
  });

  it('fails closed without a role', () => {
    currentUser$.next(user(null));

    expect(service.has(PERMISSIONS.makeEntry)).toBeFalse();
  });

  it('fails closed when the session is not authenticated', () => {
    currentUser$.next(user(role({ canMakeEntry: true })));
    sessionState$.next('anonymous');

    expect(service.has(PERMISSIONS.makeEntry)).toBeFalse();
  });

  it('returns the exact boolean permission value', () => {
    currentUser$.next(user(role({ canMakeEntry: true, canMakeOutput: false })));

    expect(service.has(PERMISSIONS.makeEntry)).toBeTrue();
    expect(service.has(PERMISSIONS.makeOutput)).toBeFalse();
  });

  it('requires every permission in hasAll', () => {
    currentUser$.next(user(role({ canManageUsers: true, canManageRoles: false })));

    expect(service.hasAll([PERMISSIONS.manageUsers])).toBeTrue();
    expect(service.hasAll([PERMISSIONS.manageUsers, PERMISSIONS.manageRoles])).toBeFalse();
  });

  it('does not treat an empty allOf check as authority', () => {
    expect(service.hasAll([])).toBeFalse();
  });

  it('accepts at least one permission in hasAny', () => {
    currentUser$.next(user(role({ canManageUsers: true, canManageRoles: false })));

    expect(service.hasAny([PERMISSIONS.manageUsers, PERMISSIONS.manageRoles])).toBeTrue();
    expect(service.hasAny([PERMISSIONS.manageRoles, PERMISSIONS.manageCatalog])).toBeFalse();
  });

  it('does not grant permissions based on the Administrador role name', () => {
    currentUser$.next(user(role({ name: 'Administrador', canManageRoles: false })));

    expect(service.has(PERMISSIONS.manageRoles)).toBeFalse();
  });

  it('grants a permission with any role name when its boolean is true', () => {
    currentUser$.next(user(role({ name: 'Visitante especial', canManageRoles: true })));

    expect(service.has(PERMISSIONS.manageRoles)).toBeTrue();
  });
});
