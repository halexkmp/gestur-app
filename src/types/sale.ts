export type SaleStatus = 'completed' | 'cancelled';
export type PaymentMethod = 'pix' | 'dinheiro' | 'cartao';

export interface Sale {
  id: string;
  sale_number: number;
  created_at: string;
  total_amount: number;
  bugueiro_id: string | null;
  partner_company_id: string | null;
  user_id: string;
  status: SaleStatus;
  notes: string | null;
  observations: string | null;
  modified_at: string | null;
  modified_by: string | null;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface SalePayment {
  id: string;
  sale_id: string;
  payment_method: PaymentMethod;
  amount: number;
}
