import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RecentActivity } from '../../../domain/models/dashboard.model';
import { environment } from '../../../../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class GetRecentActivitiesUseCase {

  private readonly apiUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  execute(): Observable<RecentActivity[]> {
    return this.http.get<RecentActivity[]>(`${this.apiUrl}/recent-activities`);
  }
}