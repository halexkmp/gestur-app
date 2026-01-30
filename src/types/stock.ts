import { Product } from './product';
import { User } from './auth';

export type StockChangeType = 'IN' | 'OUT';

export interface UpdateStockRequest {
  product_id: string;
  change_type: StockChangeType;
  quantity_change: number;
  sale_id?: string | null;
}

export interface StockResponse {
  id: string;
  change_type: StockChangeType;
  created_at: string;
  product: Pick<Product, 'id' | 'name' | 'stock_quantity'>;
  quantity_change: number;
  sale: {
    id: string;
    sale_code: string;
  } | null;
  user: Pick<User, 'id' | 'name'>;
  reason?: string | null;
}

// Keep StockChange for backward compatibility if needed, 
// but align it with StockResponse or UpdateStockRequest
export type StockChange = StockResponse;
