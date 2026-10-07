import { HttpErrorResponse } from '@angular/common/http';
import { Subject, firstValueFrom, of, throwError } from 'rxjs';
import { LoginResponse, UserModel } from '../../domain/models/user.model';
import { AUTH_TOKEN_STORAGE_KEY } from '../auth.constants';
import { LoginUseCase } from '../usecase/auth/login.usecase';
import { LogoutUseCase } from '../usecase/auth/logout.usecase';
import { GetProfileUseCase } from '../usecase/auth/profile.usecase';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

describe('AuthService', () => {
  const user: UserModel = { ci: 123, nombre: 'Ada', roleId: 1 };
  let loginUseCase: jasmine.SpyObj<LoginUseCase>;
  let logoutUseCase: jasmine.SpyObj<LogoutUseCase>;
  let profileUseCase: jasmine.SpyObj<GetProfileUseCase>;
  let router: jasmine.SpyObj<Router>;
  let service: AuthService;

  beforeEach(() => {
    localStorage.clear();
    loginUseCase = jasmine.createSpyObj<LoginUseCase>('LoginUseCase', ['execute']);
    logoutUseCase = jasmine.createSpyObj<LogoutUseCase>('LogoutUseCase', ['execute']);
    profileUseCase = jasmine.createSpyObj<GetProfileUseCase>('GetProfileUseCase', ['execute']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate'], { url: '/dashboard' });
    router.navigate.and.resolveTo(true);
    service = new AuthService(loginUseCase, logoutUseCase, profileUseCase, router);
  });

  afterEach(() => localStorage.clear());

  it('stores access_token, hydrates profile, and publishes the authenticated user', async () => {
    loginUseCase.execute.and.returnValue(of({ access_token: 'jwt-token' }));
    profileUseCase.execute.and.returnValue(of(user));

    const result = await firstValueFrom(service.login({ ci: 123, password: 'secret' }));

    expect(result).toEqual(user);
    expect(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBe('jwt-token');
    expect(service.getCurrentUser()).toEqual(user);
    expect(service.isAuthenticated()).toBeTrue();
  });

  it('does not depend on accessToken or response.user from the login response', async () => {
    const legacyResponse = { accessToken: 'legacy', user } as unknown as LoginResponse;
    loginUseCase.execute.and.returnValue(of(legacyResponse));

    await expectAsync(
      firstValueFrom(service.login({ ci: 123, password: 'secret' }))
    ).toBeRejectedWithError(/access_token/);

    expect(profileUseCase.execute).not.toHaveBeenCalled();
    expect(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBeNull();
    expect(service.getCurrentUser()).toBeNull();
  });

  it('rejects an empty access_token without storing a token', async () => {
    loginUseCase.execute.and.returnValue(of({ access_token: '   ' }));

    await expectAsync(
      firstValueFrom(service.login({ ci: 123, password: 'secret' }))
    ).toBeRejectedWithError(/access_token/);

    expect(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBeNull();
  });

  it('rolls back the token and user when profile fails after login', async () => {
    const profileError = new HttpErrorResponse({ status: 500, error: { message: 'down' } });
    loginUseCase.execute.and.returnValue(of({ access_token: 'temporary-token' }));
    profileUseCase.execute.and.returnValue(throwError(() => profileError));

    await expectAsync(
      firstValueFrom(service.login({ ci: 123, password: 'secret' }))
    ).toBeRejectedWith(profileError);

    expect(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBeNull();
    expect(service.getCurrentUser()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('bootstraps without a token as anonymous and does not request profile', async () => {
    expect(await firstValueFrom(service.initializeSession())).toBe('anonymous');

    expect(profileUseCase.execute).not.toHaveBeenCalled();
    expect(service.getCurrentUser()).toBeNull();
  });

  it('bootstraps a stored token through profile as authenticated', async () => {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, 'stored-token');
    profileUseCase.execute.and.returnValue(of(user));

    expect(await firstValueFrom(service.initializeSession())).toBe('authenticated');

    expect(profileUseCase.execute).toHaveBeenCalledTimes(1);
    expect(service.getCurrentUser()).toEqual(user);
    expect(service.isAuthenticated()).toBeTrue();
  });

  it('removes a stored token and becomes anonymous when bootstrap profile returns 401', async () => {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, 'expired-token');
    profileUseCase.execute.and.returnValue(throwError(() => new HttpErrorResponse({ status: 401 })));

    expect(await firstValueFrom(service.initializeSession())).toBe('anonymous');

    expect(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBeNull();
    expect(service.getCurrentUser()).toBeNull();
  });

  it('keeps the credential and exposes error state when bootstrap profile has a server error', async () => {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, 'still-unverified-token');
    profileUseCase.execute.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    expect(await firstValueFrom(service.initializeSession())).toBe('error');

    expect(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBe('still-unverified-token');
    expect(service.hasStoredCredential()).toBeTrue();
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.getCurrentUser()).toBeNull();
    expect(await firstValueFrom(service.sessionState$)).toBe('error');
  });

  it('shares one profile request when bootstrap is invoked more than once while loading', async () => {
    const profile = new Subject<UserModel>();
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, 'stored-token');
    profileUseCase.execute.and.returnValue(profile);

    const firstInitialization = service.initializeSession();
    const secondInitialization = service.initializeSession();
    const firstResult = firstValueFrom(firstInitialization);
    const secondResult = firstValueFrom(secondInitialization);

    expect(profileUseCase.execute).toHaveBeenCalledTimes(1);
    profile.next(user);
    profile.complete();

    expect(await firstResult).toBe('authenticated');
    expect(await secondResult).toBe('authenticated');
    expect(profileUseCase.execute).toHaveBeenCalledTimes(1);
  });

  it('refreshes the profile and publishes its effective permissions without replacing the token', async () => {
    const refreshedUser: UserModel = {
      ...user,
      roleId: 2,
      role: {
        id: 2,
        name: 'Operador',
        description: '',
        canMakeEntry: false,
        canMakeOutput: false,
        canManageUsers: false,
        canManageRoles: false,
        canManageCatalog: false,
        canGenerateSeals: false,
        canGenerateLetters: false
      }
    };
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, 'jwt-token');
    profileUseCase.execute.and.returnValue(of(refreshedUser));

    expect(await firstValueFrom(service.refreshProfile())).toEqual(refreshedUser);
    expect(service.getCurrentUser()).toEqual(refreshedUser);
    expect(service.isAuthenticated()).toBeTrue();
    expect(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBe('jwt-token');
  });

  it('clears local session and navigates even when server logout fails', async () => {
    loginUseCase.execute.and.returnValue(of({ access_token: 'jwt-token' }));
    profileUseCase.execute.and.returnValue(of(user));
    await firstValueFrom(service.login({ ci: 123, password: 'secret' }));
    logoutUseCase.execute.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));

    service.logout();

    expect(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBeNull();
    expect(service.getCurrentUser()).toBeNull();
    expect(await firstValueFrom(service.sessionState$)).toBe('anonymous');
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login'], { queryParams: undefined });
  });
});
