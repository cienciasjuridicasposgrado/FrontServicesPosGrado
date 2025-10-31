export interface DashboardStats {
  total_items: number;
  low_stock_items: number;
  last_item_code?: string;
}

export interface RecentActivity {
  id: number;
  type: 'entry' | 'output';
  item_codigo: string;
  item_nombre: string;
  cantidad: number;
  fecha: Date;
  observacion?: string;
}