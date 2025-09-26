export interface DashboardStats {
  total_items: number;
  total_entries: number;
  total_outputs: number;
  low_stock_items: number;
}

export interface RecentActivity {
  id: number;
  type: 'entry' | 'output';
  item_codigo: string;
  item_nombre: string;
  cantidad: number;
  fecha: string;
  usuario: string;
  departamento?: string;
}