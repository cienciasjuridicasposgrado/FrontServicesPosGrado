import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardRepository } from '../../../domain/repositories/dashboard.repository';
import { RecentActivity } from '../../../domain/models/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class GetRecentActivitiesUseCase {
  constructor(private dashboardRepository: DashboardRepository) {}

  execute(): Observable<RecentActivity[]> {
    return this.dashboardRepository.getRecentActivities();
  }
}