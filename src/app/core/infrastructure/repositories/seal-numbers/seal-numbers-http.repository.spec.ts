import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../../environments/environment';
import { SealNumbersRepositoryImpl } from './seal-numbers-http.repository';

describe('SealNumbersRepositoryImpl', () => {
  let repository: SealNumbersRepositoryImpl;
  let httpTesting: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/seal-numbers`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SealNumbersRepositoryImpl, provideHttpClient(), provideHttpClientTesting()]
    });
    repository = TestBed.inject(SealNumbersRepositoryImpl);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('adds Idempotency-Key only to create POST and preserves the exact DTO', async () => {
    const body = { user_ci: 123, observacion: 'Creación', numeroSello: 'S-MANUAL' };
    const result = repository.create(body, 'seal-operation-0001');
    const request = httpTesting.expectOne(baseUrl);

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(body);
    expect(request.request.headers.get('Idempotency-Key')).toBe('seal-operation-0001');
    request.flush({
      id: 1,
      numeroSello: 'S-MANUAL',
      user_ci: 123,
      userName: 'Usuario',
      fecha: '2026-10-07T00:00:00.000Z',
      observacion: 'Creación'
    });
    await result;
  });

  it('does not add Idempotency-Key to PUT or DELETE', async () => {
    const update = repository.update(1, { observacion: 'Editado' });
    const updateRequest = httpTesting.expectOne(`${baseUrl}/1`);
    expect(updateRequest.request.method).toBe('PUT');
    expect(updateRequest.request.headers.has('Idempotency-Key')).toBeFalse();
    updateRequest.flush({ id: 1 });
    await update;

    const deletion = repository.delete(1);
    const deleteRequest = httpTesting.expectOne(`${baseUrl}/1`);
    expect(deleteRequest.request.method).toBe('DELETE');
    expect(deleteRequest.request.headers.has('Idempotency-Key')).toBeFalse();
    deleteRequest.flush(null);
    await deletion;
  });
});
