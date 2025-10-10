// src/app/core/infrastructure/repositories/dashboard/api-dashboard.repository.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { DashboardRepository } from '../../../domain/repositories/dashboard.repository';
import { DashboardStats, RecentActivity } from '../../../domain/models/dashboard.model';
import { environment } from '../../../../../environments/environment';

const MOCK_STATS: DashboardStats = {
  total_users: 15,
  total_items: 450,
  total_entries: 89,
  total_outputs: 67,
  low_stock_items: 3
};

const MOCK_ACTIVITIES: RecentActivity[] = [
  { 
    id: 105, 
    type: 'output', 
    item_codigo: 'MAT005', 
    item_nombre: 'Cable de Red Cat6', 
    cantidad: 100, 
    fecha: new Date(), // ← Mantener como Date
    usuario: 'Juan Pérez',
    departamento: 'Sistemas' // ← Corregido de 'departamentoNombre' a 'departamento'
  },
  { 
    id: 104, 
    type: 'entry', 
    item_codigo: 'TLR001', 
    item_nombre: 'Tóner HP Negro', 
    cantidad: 5, 
    fecha: new Date(), // ← Mantener como Date
    usuario: 'María García'
  },
  { 
    id: 103, 
    type: 'output', 
    item_codigo: 'OFF010', 
    item_nombre: 'Resmas de Papel A4', 
    cantidad: 20, 
    fecha: new Date(), // ← Mantener como Date
    usuario: 'Carlos López',
    departamento: 'Dirección' // ← Corregido de 'departamentoNombre' a 'departamento'
  },
  { 
    id: 102, 
    type: 'entry', 
    item_codigo: 'MAT005', 
    item_nombre: 'Cable de Red Cat6', 
    cantidad: 500, 
    fecha: new Date(), // ← Mantener como Date
    usuario: 'Ana Martínez'
  },
];
@Injectable({ providedIn: 'root' })
export class ApiDashboardRepository extends DashboardRepository {
  private apiBaseUrl = environment.apiUrl + '/dashboard'; 

  constructor(private http: HttpClient) {
    super();
  }

  getStats(): Observable<DashboardStats> {
    const url = `${this.apiBaseUrl}/stats`; 
    return this.http.get<DashboardStats>(url);
  }

  getRecentActivities(): Observable<RecentActivity[]> {
    const url = `${this.apiBaseUrl}/recent-activities`; 
    return this.http.get<RecentActivity[]>(url);
  }
}
