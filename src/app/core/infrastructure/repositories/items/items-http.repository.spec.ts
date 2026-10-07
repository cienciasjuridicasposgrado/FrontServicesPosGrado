import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../../environments/environment';
import { ItemsHttpRepository } from './items-http.repository';

describe('ItemsHttpRepository', () => {
  let repository: ItemsHttpRepository;
  let httpTesting: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/items`;
  const response = { codigo: 'ABC', nombreItem: 'Papel', stock: 0, unidad: 'paq' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ItemsHttpRepository, provideHttpClient(), provideHttpClientTesting()]
    });
    repository = TestBed.inject(ItemsHttpRepository);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('POSTs the exact create payload and strips stock from an unsafe object', async () => {
    const result = repository.createItem({ ...response, stock: 99 } as never);
    const request = httpTesting.expectOne(baseUrl);

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      codigo: 'ABC',
      nombreItem: 'Papel',
      unidad: 'paq'
    });
    expect(request.request.body.stock).toBeUndefined();
    request.flush(response);
    await result;
  });

  it('PATCHes only metadata and strips codigo and stock from an unsafe object', async () => {
    const result = repository.updateItem('ABC', {
      codigo: 'OTRO',
      nombreItem: 'Papel carta',
      stock: 500,
      unidad: 'caja'
    } as never);
    const request = httpTesting.expectOne(`${baseUrl}/ABC`);

    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ nombreItem: 'Papel carta', unidad: 'caja' });
    expect(request.request.body.codigo).toBeUndefined();
    expect(request.request.body.stock).toBeUndefined();
    request.flush({ ...response, nombreItem: 'Papel carta', unidad: 'caja' });
    await result;
  });

  it('preserves HttpErrorResponse status and structured body', async () => {
    const result = repository.createItem({ codigo: 'ABC', nombreItem: 'Papel', unidad: 'paq' });
    httpTesting.expectOne(baseUrl).flush(
      { message: 'El código ya existe', details: ['codigo'] },
      { status: 409, statusText: 'Conflict' }
    );

    let received: unknown;
    try {
      await result;
    } catch (error) {
      received = error;
    }

    expect(received).toBeInstanceOf(HttpErrorResponse);
    expect((received as HttpErrorResponse).status).toBe(409);
    expect((received as HttpErrorResponse).error).toEqual({
      message: 'El código ya existe',
      details: ['codigo']
    });
  });
});
