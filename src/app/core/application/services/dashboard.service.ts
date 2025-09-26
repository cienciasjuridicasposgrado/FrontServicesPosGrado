import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GetStatsUseCase } from '../usecase/dashboard/get-stats.usecase';
import { GetRecentActivitiesUseCase } from '../usecase/dashboard/get-recent-activities.usecase';
import { DashboardStats, RecentActivity } from '../../domain/models/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  constructor(
    private getStatsUseCase: GetStatsUseCase,
    private getRecentActivitiesUseCase: GetRecentActivitiesUseCase
  ) {}

  getStats(): Observable<DashboardStats> {
    return this.getStatsUseCase.execute();
  }

  getRecentActivities(): Observable<RecentActivity[]> {
    return this.getRecentActivitiesUseCase.execute();
  }
}