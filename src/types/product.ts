export type ProductType = 'bebida' | 'tirolesa' | 'combo_foto' | 'combo_drone';

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  default_price: number;
  has_stock: boolean;
  stock_quantity: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}
