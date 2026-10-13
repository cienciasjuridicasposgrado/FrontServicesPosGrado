export const LOW_STOCK_THRESHOLD = 5;

export type StockStatus = 'empty' | 'low' | 'normal';

export function getStockStatus(stock: number): StockStatus {
  if (stock === 0) return 'empty';
  if (stock > 0 && stock <= LOW_STOCK_THRESHOLD) return 'low';
  return 'normal';
}
