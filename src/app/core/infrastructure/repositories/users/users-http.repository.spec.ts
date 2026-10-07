import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../../environments/environment';
import { UsersHttpRepository } from './users-http.repository';

describe('UsersHttpRepository', () => {
  let repository: UsersHttpRepository;
  let httpTesting: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/users`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UsersHttpRepository,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    repository = TestBed.inject(UsersHttpRepository);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('POSTs the exact create-user body once, including numeric role_id', async () => {
    const result = repository.createUser({
      ci: 1234567,
      nombre: 'Ada',
      password: 'password',
      role_id: 2
    });
    const request = httpTesting.expectOne(baseUrl);

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      ci: 1234567,
      nombre: 'Ada',
      password: 'password',
      role_id: 2
    });
    expect(typeof request.request.body.role_id).toBe('number');
    request.flush({ ci: 1234567, nombre: 'Ada', roleId: 2 });
    await result;
  });

  it('PATCHes only general fields and strips role_id even from an unsafe runtime object', async () => {
    const result = repository.updateUser(1234567, {
      nombre: 'Ada Byron',
      password: 'new-password',
      role_id: 99
    } as never);
    const request = httpTesting.expectOne(`${baseUrl}/1234567`);

    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({
      nombre: 'Ada Byron',
      password: 'new-password'
    });
    expect(request.request.body.role_id).toBeUndefined();
    request.flush({ ci: 1234567, nombre: 'Ada Byron', roleId: 2 });
    await result;
  });

  it('PATCHes the dedicated role URL with the exact role-only body', async () => {
    const result = repository.updateUserRole(1234567, { role_id: 5 });
    const request = httpTesting.expectOne(`${baseUrl}/1234567/role`);

    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ role_id: 5 });
    expect(Object.keys(request.request.body)).toEqual(['role_id']);
    request.flush({ ci: 1234567, nombre: 'Ada', roleId: 5 });
    await result;
  });
});
