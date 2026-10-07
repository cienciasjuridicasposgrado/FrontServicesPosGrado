import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RecentActivity } from '../../../domain/models/dashboard.model';
import { DashboardRepository } from '../../../domain/repositories/dashboard.repository';

@Injectable({
  providedIn: 'root'
})
export class GetRecentActivitiesUseCase {
  constructor(private dashboardRepository: DashboardRepository) {}

  execute(): Observable<RecentActivity[]> {
    return this.dashboardRepository.getRecentActivities();
  }
}
