import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../../environments/environment';
import { LetterNumberHttpRepository } from './letter-number-http.repository';

describe('LetterNumberHttpRepository', () => {
  let repository: LetterNumberHttpRepository;
  let httpTesting: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/letter-numbers`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LetterNumberHttpRepository, provideHttpClient(), provideHttpClientTesting()]
    });
    repository = TestBed.inject(LetterNumberHttpRepository);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('adds Idempotency-Key only to create POST and keeps user_ci in the DTO', async () => {
    const body = { user_ci: 123, observacion: 'Carta' };
    const result = repository.create(body, 'letter-operation-0001');
    const request = httpTesting.expectOne(baseUrl);

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(body);
    expect(request.request.headers.get('Idempotency-Key')).toBe('letter-operation-0001');
    request.flush({
      id: 1,
      numero_carta: '1800',
      fecha: '2026-10-07T00:00:00.000Z',
      observacion: 'Carta',
      user: { ci: 123, nombre: 'Usuario' }
    });
    await result;
  });

  it('does not add Idempotency-Key to PUT or DELETE', async () => {
    const update = repository.update(1, { observacion: 'Editada' });
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
