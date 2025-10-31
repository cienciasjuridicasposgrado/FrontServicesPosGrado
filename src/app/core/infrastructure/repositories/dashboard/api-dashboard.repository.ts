import { Injectable } from '@angular/core';
import { DashboardRepository } from '../../../domain/repositories/dashboard.repository';
import { DashboardService } from '../../../application/services/dashboard.service';
import { HttpClient } from '@angular/common/http';
import { DashboardStats, RecentActivity } from '../../../domain/models/dashboard.model';
import { Observable } from 'rxjs';
@Injectable({ 
  providedIn: 'root' 
})
export class ApiDashboardRepository extends DashboardRepository {
  private readonly baseUrl = '/dashboard';

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
