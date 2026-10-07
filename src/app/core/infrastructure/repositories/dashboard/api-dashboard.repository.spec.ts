import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../../environments/environment';
import { DashboardStats, RecentActivity } from '../../../domain/models/dashboard.model';
import { ApiDashboardRepository } from './api-dashboard.repository';

describe('ApiDashboardRepository', () => {
  let repository: ApiDashboardRepository;
  let httpTesting: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/dashboard`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ApiDashboardRepository, provideHttpClient(), provideHttpClientTesting()]
    });
    repository = TestBed.inject(ApiDashboardRepository);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('loads stats through the configured API base URL', () => {
    const response = { totalItems: 1, lowStockItems: 1, lastItemCode: 'ITEM-001' };
    let result: DashboardStats | undefined;
    repository.getStats().subscribe((stats) => result = stats);

    const request = httpTesting.expectOne(`${baseUrl}/stats`);
    expect(request.request.method).toBe('GET');
    request.flush(response);
    expect(result).toEqual(response);
  });

  it('loads recent activities through the configured API base URL', () => {
    const response = [{
      id: '8',
      type: 'entry' as const,
      itemId: 'ITEM-001',
      itemNombre: 'Papel bond',
      cantidad: 10,
      fecha: '2026-10-07T14:00:00.000Z',
      observacion: 'Ingreso local'
    }];
    let result: RecentActivity[] | undefined;
    repository.getRecentActivities().subscribe((activities) => result = activities);

    const request = httpTesting.expectOne(`${baseUrl}/recent-activities`);
    expect(request.request.method).toBe('GET');
    request.flush(response);
    expect(result).toEqual(response);
  });
});
