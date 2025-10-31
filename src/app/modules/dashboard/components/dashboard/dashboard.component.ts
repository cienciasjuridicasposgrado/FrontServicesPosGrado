import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { DashboardService } from '../../../../core/application/services/dashboard.service';
import { DashboardStats, RecentActivity } from '../../../../core/domain/models/dashboard.model';
import { AuthService } from '../../../../core/application/services/auth.service';
import { UserModel } from '../../../../core/domain/models/user.model';
import { MatMenuModule } from '@angular/material/menu';

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
export class DashboardComponent implements OnInit, OnDestroy {
  stats: DashboardStats | null = null;
  recentActivities: RecentActivity[] = [];
  user: UserModel | null = null;
  loading = true;
  private destroy$ = new Subject<void>();

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDashboardData(): void {
    this.dashboardService.getStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.stats = stats;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading stats:', error);
          this.loading = false;
        }
      });

    this.dashboardService.getRecentActivities()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (activities) => {
          this.recentActivities = activities;
        },
        error: (error) => {
          console.error('Error loading activities:', error);
        }
      });
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