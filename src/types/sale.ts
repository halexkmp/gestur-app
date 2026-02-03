export type SaleStatus = 'COMPLETED' | 'PENDING' | 'CANCELED';
export type PaymentMethod = 'PIX' | 'CURRENCY' | 'CREDIT_CARD' | 'BUSINESS_PARTNER';

export interface Sale {
  id: string;
  sale_code: string;
  total_amount: number;
  partner_id: string | null;
  partner_customer_quantity: number | null;
  partner_customer_shift: string | null
  user_id: string;
  status: SaleStatus;
  notes: string | null;
  observations: string | null;
  created_at: string;
  items: SaleItem[];
  payments: SalePayment[];
}

export interface SaleItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface SalePayment {
  id: string;
  payment_method: PaymentMethod;
  amount: number;
}
