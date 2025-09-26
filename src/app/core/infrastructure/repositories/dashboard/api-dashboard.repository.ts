import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

import { DashboardRepository } from '../../../domain/repositories/dashboard.repository';
import { DashboardStats, RecentActivity } from '../../../domain/models/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class ApiDashboardRepository implements DashboardRepository {
  private apiUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/stats`);
  }

  getRecentActivities(): Observable<RecentActivity[]> {
    return this.http.get<RecentActivity[]>(`${this.apiUrl}/recent-activities`);
  }
}