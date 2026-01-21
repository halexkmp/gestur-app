export type StockChangeType = 'entrada' | 'saida' | 'ajuste' | 'venda';

export interface StockChange {
  id: string;
  product_id: string;
  change_type: StockChangeType;
  quantity_change: number;
  reason: string | null;
  user_id: string;
  created_at: string;
}
