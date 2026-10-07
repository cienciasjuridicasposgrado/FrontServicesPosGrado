import { Injectable } from '@angular/core';
import { DashboardRepository } from '../../../domain/repositories/dashboard.repository';
import { HttpClient } from '@angular/common/http';
import { DashboardStats, RecentActivity } from '../../../domain/models/dashboard.model';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
@Injectable({ 
  providedIn: 'root' 
})
export class ApiDashboardRepository extends DashboardRepository {
  private readonly baseUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {
    super();
  }

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.baseUrl}/stats`);
  }

  getRecentActivities(): Observable<RecentActivity[]> {
    return this.http.get<RecentActivity[]>(`${this.baseUrl}/recent-activities`);
  }
}
