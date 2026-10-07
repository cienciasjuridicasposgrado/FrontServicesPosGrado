import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../../environments/environment';
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
    repository.getStats().subscribe();

    const request = httpTesting.expectOne(`${baseUrl}/stats`);
    expect(request.request.method).toBe('GET');
    request.flush({ total_items: 0, low_stock_items: 0 });
  });

  it('loads recent activities through the configured API base URL', () => {
    repository.getRecentActivities().subscribe();

    const request = httpTesting.expectOne(`${baseUrl}/recent-activities`);
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });
});
