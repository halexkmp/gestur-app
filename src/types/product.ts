export type ProductType = 'DRINK' | 'ZIPLINE' | 'PHOTO_COMBO' | 'DRONE_COMBO';

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  price: number;
  stock_quantity: number;
  active: boolean;
  created_at: string;
}
