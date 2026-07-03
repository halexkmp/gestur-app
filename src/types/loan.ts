export type LoanStatus =
  | 'ACTIVE'
  | 'FINISHED'
  | 'DEFAULTED'
  | 'CANCELLED';

export interface LoanInstallment {
  id: string;
  loan_id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  payment_date: string | null;
  paid: boolean;
  created_at: string;
  updated_at: string;
}

export interface Loan {
  id: string;
  partner_id: string;
  principal_amount: number;
  interest_rate: number;
  total_amount: number;
  installments: number;
  due_day: number;
  start_date: string;
  end_date: string;
  status: LoanStatus;
  created_at: string;
  updated_at: string;
  installments_list?: LoanInstallment[];
}

export interface CreateLoanRequest {
  partner_id: string;
  principal_amount: number;
  interest_rate: number;
  installments: number;
  due_day: number;
  start_date: string;
  end_date: string;
}
