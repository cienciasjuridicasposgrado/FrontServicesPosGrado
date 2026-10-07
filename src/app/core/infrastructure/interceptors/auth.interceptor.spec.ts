import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '../../application/services/auth.service';
import { AUTH_TOKEN_STORAGE_KEY } from '../../application/auth.constants';
import { authInterceptor } from './auth.interceptor';
import { LoginUseCase } from '../../application/usecase/auth/login.usecase';
import { LogoutUseCase } from '../../application/usecase/auth/logout.usecase';
import { GetProfileUseCase } from '../../application/usecase/auth/profile.usecase';
import { firstValueFrom, of } from 'rxjs';
import { UserModel } from '../../domain/models/user.model';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let authService: AuthService;
  let loginUseCase: jasmine.SpyObj<LoginUseCase>;
  let logoutUseCase: jasmine.SpyObj<LogoutUseCase>;
  let profileUseCase: jasmine.SpyObj<GetProfileUseCase>;
  let router: jasmine.SpyObj<Router>;
  const user: UserModel = { ci: 123, nombre: 'Ada', roleId: 1 };

  beforeEach(() => {
    localStorage.clear();
    loginUseCase = jasmine.createSpyObj<LoginUseCase>('LoginUseCase', ['execute']);
    logoutUseCase = jasmine.createSpyObj<LogoutUseCase>('LogoutUseCase', ['execute']);
    profileUseCase = jasmine.createSpyObj<GetProfileUseCase>('GetProfileUseCase', ['execute']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate'], { url: '/dashboard/items' });
    router.navigate.and.resolveTo(true);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        AuthService,
        { provide: LoginUseCase, useValue: loginUseCase },
        { provide: LogoutUseCase, useValue: logoutUseCase },
        { provide: GetProfileUseCase, useValue: profileUseCase },
        { provide: Router, useValue: router }
      ]
    });

    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('does not attach Authorization to POST /auth/login', () => {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, 'jwt-token');
    http.post('/auth/login', {}).subscribe();

    const request = httpTesting.expectOne('/auth/login');
    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush({ access_token: 'new-token' });
  });

  it('attaches the access_token to GET /auth/profile', () => {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, 'jwt-token');
    http.get('/auth/profile').subscribe();

    const request = httpTesting.expectOne('/auth/profile');
    expect(request.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    request.flush({});
  });

  it('attaches the access_token to POST /auth/logout', () => {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, 'jwt-token');
    http.post('/auth/logout', {}).subscribe();

    const request = httpTesting.expectOne('/auth/logout');
    expect(request.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    request.flush(null);
  });

  it('attaches the token to private endpoints and preserves existing headers', () => {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, 'jwt-token');
    http.get('/items', { headers: { 'X-Correlation-Id': 'abc' } }).subscribe();

    const request = httpTesting.expectOne('/items');
    expect(request.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    expect(request.request.headers.get('X-Correlation-Id')).toBe('abc');
    request.flush([]);
  });

  it('does not attach Authorization when access_token is absent or blank', () => {
    http.get('/items').subscribe();

    const request = httpTesting.expectOne('/items');
    expect(request.request.headers.has('Authorization')).toBeFalse();
    expect(request.request.headers.get('Authorization')).not.toBe('Bearer undefined');
    request.flush([]);
  });

  it('does not attach Authorization when access_token is blank', () => {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, '   ');
    http.get('/items').subscribe();

    const request = httpTesting.expectOne('/items');
    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush([]);
  });

  it('clears session, redirects once, and preserves the original protected 401', async () => {
    loginUseCase.execute.and.returnValue(of({ access_token: 'jwt-token' }));
    profileUseCase.execute.and.returnValue(of(user));
    await firstValueFrom(authService.login({ ci: 123, password: 'secret' }));
    const handleUnauthorized = spyOn(authService, 'handleUnauthorized').and.callThrough();
    let receivedError: HttpErrorResponse | undefined;
    http.get('/items').subscribe({ error: (error) => receivedError = error });

    const request = httpTesting.expectOne('/items');
    request.flush({ message: 'expired' }, { status: 401, statusText: 'Unauthorized' });

    expect(handleUnauthorized).toHaveBeenCalledOnceWith('/dashboard/items');
    expect(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBeNull();
    expect(authService.getCurrentUser()).toBeNull();
    expect(router.navigate).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith(
      ['/auth/login'],
      { queryParams: { returnUrl: '/dashboard/items' } }
    );
    expect(receivedError?.status).toBe(401);
    expect(receivedError?.error).toEqual({ message: 'expired' });
  });

  it('does not issue duplicate login redirects for concurrent protected 401 responses', async () => {
    loginUseCase.execute.and.returnValue(of({ access_token: 'jwt-token' }));
    profileUseCase.execute.and.returnValue(of(user));
    await firstValueFrom(authService.login({ ci: 123, password: 'secret' }));
    const handleUnauthorized = spyOn(authService, 'handleUnauthorized').and.callThrough();
    http.get('/items').subscribe({ error: () => undefined });
    http.get('/roles').subscribe({ error: () => undefined });
    http.get('/departamentos').subscribe({ error: () => undefined });

    httpTesting.expectOne('/items').flush(null, { status: 401, statusText: 'Unauthorized' });
    httpTesting.expectOne('/roles').flush(null, { status: 401, statusText: 'Unauthorized' });
    httpTesting.expectOne('/departamentos').flush(
      null,
      { status: 401, statusText: 'Unauthorized' }
    );

    expect(handleUnauthorized).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBeNull();
    expect(authService.getCurrentUser()).toBeNull();
  });

  it('does not let a stale 401 clear a session created with a newer token', async () => {
    loginUseCase.execute.and.returnValue(of({ access_token: 'old-token' }));
    profileUseCase.execute.and.returnValue(of(user));
    await firstValueFrom(authService.login({ ci: 123, password: 'secret' }));
    http.get('/items').subscribe({ error: () => undefined });

    loginUseCase.execute.and.returnValue(of({ access_token: 'new-token' }));
    await firstValueFrom(authService.login({ ci: 123, password: 'new-secret' }));
    httpTesting.expectOne('/items').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBe('new-token');
    expect(authService.getCurrentUser()).toEqual(user);
    expect(authService.isAuthenticated()).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('does not trigger global logout for a login 401', () => {
    const handleUnauthorized = spyOn(authService, 'handleUnauthorized').and.callThrough();
    let receivedError: HttpErrorResponse | undefined;
    http.post('/auth/login', {}).subscribe({ error: (error) => receivedError = error });

    const request = httpTesting.expectOne('/auth/login');
    request.flush({ message: 'invalid credentials' }, { status: 401, statusText: 'Unauthorized' });

    expect(handleUnauthorized).not.toHaveBeenCalled();
    expect(receivedError?.error).toEqual({ message: 'invalid credentials' });
  });

  it('preserves token and hydrated user and does not navigate to login for 403', async () => {
    loginUseCase.execute.and.returnValue(of({ access_token: 'jwt-token' }));
    profileUseCase.execute.and.returnValue(of(user));
    await firstValueFrom(authService.login({ ci: 123, password: 'secret' }));
    const handleUnauthorized = spyOn(authService, 'handleUnauthorized').and.callThrough();
    let receivedError: HttpErrorResponse | undefined;
    http.get('/roles').subscribe({ error: (error) => receivedError = error });

    const request = httpTesting.expectOne('/roles');
    request.flush({ message: 'forbidden' }, { status: 403, statusText: 'Forbidden' });

    expect(handleUnauthorized).not.toHaveBeenCalled();
    expect(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBe('jwt-token');
    expect(authService.getCurrentUser()).toEqual(user);
    expect(authService.isAuthenticated()).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(receivedError?.status).toBe(403);
    expect(receivedError?.error).toEqual({ message: 'forbidden' });
  });

  it('preserves the session and original error for a network failure', async () => {
    loginUseCase.execute.and.returnValue(of({ access_token: 'jwt-token' }));
    profileUseCase.execute.and.returnValue(of(user));
    await firstValueFrom(authService.login({ ci: 123, password: 'secret' }));
    const handleUnauthorized = spyOn(authService, 'handleUnauthorized').and.callThrough();
    let receivedError: HttpErrorResponse | undefined;
    http.get('/items').subscribe({ error: (error) => receivedError = error });

    const request = httpTesting.expectOne('/items');
    request.error(new ProgressEvent('error'));

    expect(handleUnauthorized).not.toHaveBeenCalled();
    expect(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBe('jwt-token');
    expect(authService.getCurrentUser()).toEqual(user);
    expect(authService.isAuthenticated()).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(receivedError?.status).toBe(0);
  });
});
