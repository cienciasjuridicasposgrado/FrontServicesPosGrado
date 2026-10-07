import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../../environments/environment';
import { InventoryOutputsHttpRepository } from './inventory-outputs-http.repository';

describe('InventoryOutputsHttpRepository', () => {
  let repository: InventoryOutputsHttpRepository;
  let httpTesting: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/inventory-outputs`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [InventoryOutputsHttpRepository, provideHttpClient(), provideHttpClientTesting()]
    });
    repository = TestBed.inject(InventoryOutputsHttpRepository);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('serializes create cantidad as a JSON number', async () => {
    const result = repository.createOutput({
      itemCodigo: 'ABC', cantidad: 5, userCi: 123, departamentoId: 9, observacion: ''
    });
    const request = httpTesting.expectOne(baseUrl);

    expect(request.request.body.cantidad).toBe(5);
    expect(typeof request.request.body.cantidad).toBe('number');
    request.flush({ id: 1, itemCodigo: 'ABC', cantidad: 5, userCi: 123, departamentoId: 9, fecha: new Date() });
    await result;
  });

  it('PATCHes the correct URL with only observacion from an unsafe runtime object', async () => {
    const result = repository.updateOutput(8, {
      observacion: 'Entrega corregida',
      cantidad: 50,
      itemCodigo: 'OTRO',
      userCi: 999,
      departamentoId: 3,
      fecha: 'ayer',
      item: {},
      user: {},
      departamento: {}
    } as never);
    const request = httpTesting.expectOne(`${baseUrl}/8`);

    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ observacion: 'Entrega corregida' });
    expect(Object.keys(request.request.body)).toEqual(['observacion']);
    request.flush({ id: 8, itemCodigo: 'ABC', cantidad: 5, userCi: 123, departamentoId: 9, observacion: 'Entrega corregida', fecha: new Date() });
    await result;
  });
});
