export type StockChangeType = 'IN' | 'OUT';

export interface UpdateStockRequest {
  product_id: string;
  change_type: StockChangeType;
  quantity_change: number;
  sale_id?: string | null;
}

export interface StockResponse {
  id: string;
  product_id: string;
  change_type: StockChangeType;
  quantity_change: number;
  sale_id: string | null;
  user_id: string;
  created_at: string;
}

// Keep StockChange for backward compatibility if needed, 
// but align it with StockResponse or UpdateStockRequest
export type StockChange = StockResponse;
