export type ProductType = 'SERVICE' | 'CONSUMABLE';

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  default_price: number;
  stock_quantity: number;
  active: boolean;
  created_at: string;
}
