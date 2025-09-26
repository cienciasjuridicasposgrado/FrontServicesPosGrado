import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardRepository } from '../../../domain/repositories/dashboard.repository';
import { DashboardStats } from '../../../domain/models/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class GetStatsUseCase {
  constructor(private dashboardRepository: DashboardRepository) {}

  execute(): Observable<DashboardStats> {
    return this.dashboardRepository.getStats();
  }
}