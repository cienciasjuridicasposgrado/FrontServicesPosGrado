import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardRepository } from '../../../domain/repositories/dashboard.repository';
import { DashboardStats } from '../../../domain/models/dashboard.model';
import { environment } from '../../../../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class GetStatsUseCase {
  private readonly apiUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  execute(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/stats`);
  }
}