import { Observable } from 'rxjs';
import { DashboardStats, RecentActivity } from '../models/dashboard.model';

export abstract class DashboardRepository {
  abstract getStats(): Observable<DashboardStats>;
  abstract getRecentActivities(): Observable<RecentActivity[]>;
}