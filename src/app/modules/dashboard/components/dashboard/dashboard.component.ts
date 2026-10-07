import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';

import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { DashboardService } from '../../../../core/application/services/dashboard.service';
import { DashboardStats, RecentActivity } from '../../../../core/domain/models/dashboard.model';
import { AuthService } from '../../../../core/application/services/auth.service';
import { UserModel } from '../../../../core/domain/models/user.model';
import { MatMenuModule } from '@angular/material/menu';
import { getFallbackMessage } from '../../../../shared/utils/http-error-message';
import { POLLING_INTERVALS } from '../../../../shared/polling/polling-intervals';
import { PeriodicRefreshHandle, PeriodicRefreshService } from '../../../../shared/polling/periodic-refresh.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private statsPolling?: PeriodicRefreshHandle<DashboardStats>;
  private activitiesPolling?: PeriodicRefreshHandle<RecentActivity[]>;
  private statsSettled = false;
  private activitiesSettled = false;
  stats: DashboardStats | null = null;
  recentActivities: RecentActivity[] = [];
  user: UserModel | null = null;
  loading = true;
  statsError = '';
  activityError = '';

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService,
    private periodicRefresh: PeriodicRefreshService
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.startDashboardPolling();
  }

  private startDashboardPolling(): void {
    this.statsPolling = this.periodicRefresh.create({
      intervalMs: POLLING_INTERVALS.dashboard,
      request: () => this.dashboardService.getStats()
    });
    this.activitiesPolling = this.periodicRefresh.create({
      intervalMs: POLLING_INTERVALS.dashboard,
      request: () => this.dashboardService.getRecentActivities()
    });

    this.statsPolling.events$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        this.statsSettled = true;
        if (event.type === 'success') {
          this.stats = event.data;
          this.statsError = '';
        } else {
          console.error('Error loading stats:', event.error);
          this.statsError = getFallbackMessage(event.error, 'No se pudo cargar el resumen.');
        }
        this.updateInitialLoading();
      });

    this.activitiesPolling.events$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        this.activitiesSettled = true;
        if (event.type === 'success') {
          this.recentActivities = event.data;
          this.activityError = '';
        } else {
          console.error('Error loading activities:', event.error);
          this.activityError = getFallbackMessage(event.error, 'No se pudo cargar la actividad reciente.');
        }
        this.updateInitialLoading();
      });
  }

  private updateInitialLoading(): void {
    this.loading = !(this.statsSettled && this.activitiesSettled);
  }

  retryLoad(): void {
    this.statsPolling?.refresh();
    this.activitiesPolling?.refresh();
  }

  getActivityIcon(activity: RecentActivity): string {
    switch (activity.type) {
      case 'entry': return 'input';
      case 'output': return 'output';
      default: return 'info';
    }
  }

  getActivityColor(activity: RecentActivity): string {
    switch (activity.type) {
      case 'entry': return 'primary';
      case 'output': return 'accent';
      default: return 'basic';
    }
  }

  getActivityLabel(activity: RecentActivity): string {
    switch (activity.type) {
      case 'entry': return 'Entrada';
      case 'output': return 'Salida';
      default: return 'Actividad';
    }
  }

  getWelcomeMessage(): string {
    const hour = new Date().getHours();
    if (hour < 12) return '¡Que tengas un buen día!';
    if (hour < 18) return '¡Que tengas una buena tarde!';
    return '¡Que tengas una buena noche!';
  }
}
