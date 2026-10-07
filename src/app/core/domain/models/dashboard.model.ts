export interface DashboardStats {
  totalItems: number;
  lowStockItems: number;
  lastItemCode?: string;
}

export interface RecentActivity {
  id: string;
  type: 'entry' | 'output';
  itemId: string;
  itemNombre: string;
  cantidad: number;
  fecha: string;
  observacion?: string;
}
