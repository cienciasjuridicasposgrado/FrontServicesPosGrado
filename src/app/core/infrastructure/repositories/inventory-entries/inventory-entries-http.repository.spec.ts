import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../../environments/environment';
import { InventoryEntriesHttpRepository } from './inventory-entries-http.repository';

describe('InventoryEntriesHttpRepository', () => {
  let repository: InventoryEntriesHttpRepository;
  let httpTesting: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/inventory-entries`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [InventoryEntriesHttpRepository, provideHttpClient(), provideHttpClientTesting()]
    });
    repository = TestBed.inject(InventoryEntriesHttpRepository);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('serializes only allowed create fields even for an unsafe runtime object', async () => {
    const result = repository.createEntry({
      itemCodigo: 'ABC', cantidad: 5, observacion: '', userCi: 999
    } as never);
    const request = httpTesting.expectOne(baseUrl);

    expect(request.request.method).toBe('POST');
    expect(request.request.body.cantidad).toBe(5);
    expect(typeof request.request.body.cantidad).toBe('number');
    expect(request.request.body).toEqual({
      itemCodigo: 'ABC', cantidad: 5, observacion: ''
    });
    expect(request.request.body.userCi).toBeUndefined();
    request.flush({ id: 1, itemCodigo: 'ABC', cantidad: 5, userCi: 123, observacion: '', fecha: new Date() });
    await result;
  });

  it('PATCHes only observacion even for an unsafe runtime object', async () => {
    const result = repository.updateEntry(7, {
      observacion: 'Corregida', itemCodigo: 'OTRO', cantidad: 50, userCi: 999, fecha: 'ayer'
    } as never);
    const request = httpTesting.expectOne(`${baseUrl}/7`);

    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ observacion: 'Corregida' });
    expect(Object.keys(request.request.body)).toEqual(['observacion']);
    request.flush({ id: 7, itemCodigo: 'ABC', cantidad: 5, userCi: 123, observacion: 'Corregida', fecha: new Date() });
    await result;
  });
});
