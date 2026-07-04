export type LoanStatus =
  | 'ACTIVE'
  | 'FINISHED'
  | 'DEFAULTED'
  | 'CANCELLED'
  | 'PAID'
  | 'CANCELED';

export type InstallmentStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID';

export interface LoanInstallmentPayment {
  id: string;
  loan_installment_id: string;
  amount: number;
  payment_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface LoanInstallment {
  id: string;
  loan_id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  payment_date: string | null;
  paid: boolean;
  status?: InstallmentStatus;
  created_at: string;
  updated_at: string;
}

export interface Loan {
  id: string;
  partner_id: string;
  principal_amount: number;
  interest_rate: number;
  total_amount: number;
  installments_qty: number;
  start_date: string;
  end_date: string;
  status: LoanStatus;
  created_at: string;
  updated_at: string;
  installments?: LoanInstallment[];
}

export interface CreateLoanRequest {
  partner_id: string;
  principal_amount: number;
  interest_rate: number;
  installments_qty: number;
  start_date: string;
}

export interface UpdateLoanRequest {
  status?: LoanStatus;
}
