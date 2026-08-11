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
export interface LoanSummary {
  id: string;
  partner_id: string;
  partner_name: string;
  principal_amount: string;
  interest_rate: string;
  total_amount: string;
  installments_qty: number;
  due_weekday: string;
  start_date: string;
  end_date: string;
  status: string;

  total_paid: string;
  remaining_balance: string;

  total_payments: number;
  paid_installments: number;
  partially_paid_installments: number;
  pending_installments: number;

  installments: LoanSummaryInstallment[];
}

export interface LoanSummaryInstallment {
  id: string;
  installment_number: number;
  amount: string;
  due_date: string;
  status: string;
  payment_date: string | null;

  payments: LoanSummaryPayment[];
}

export interface LoanSummaryPayment {
  id: string;
  amount: string;
  payment_date: string;
}

/**
 * Aggregate view of the loan book over a date range, from
 * GET /loans/period-summary. Every monetary field is a decimal string with two
 * decimals ("0.00", never "0") — see specs/api/loans.md.
 */
export interface LoanPeriodSummary {
  start_date: string;
  end_date: string;
  expected_revenue: string;
  expected_capital: string;
  expected_profit: string;
  received_amount: string;
  outstanding_amount: string;
  installments_count: number;
  partners_count: number;
  partners: LoanPeriodSummaryPartner[];
}

/** One partner's share of a period summary, combined across all their loans. */
export interface LoanPeriodSummaryPartner {
  partner_id: string;
  partner_name: string;
  scheduled_amount: string;
  received_amount: string;
  outstanding_amount: string;
  installments_count: number;
}

export interface LoanPeriodSummaryParams {
  start_date: string;
  end_date: string;
}

/**
 * Status of an installment that is still owed. `GET /loans/upcoming-installments`
 * guarantees it never returns a settled installment, so `PAID` is excluded here —
 * derived from `InstallmentStatus` rather than redeclared so the two cannot drift.
 * See specs/api/loans.md.
 */
export type UpcomingInstallmentStatus = Exclude<InstallmentStatus, 'PAID'>;

/**
 * One unsettled installment of one partner's loan, from
 * GET /loans/upcoming-installments — a flat array with no envelope. Every monetary
 * field is a decimal string with two decimals ("0.00", never "0"), and
 * `is_overdue` is computed server-side against the server's current date,
 * independently of the requested window — see specs/api/loans.md.
 */
export interface UpcomingInstallment {
  installment_id: string;
  loan_id: string;
  partner_id: string;
  partner_name: string;
  installment_number: number;
  due_date: string;
  amount: string;
  paid_amount: string;
  remaining_amount: string;
  status: UpcomingInstallmentStatus;
  is_overdue: boolean;
}

export interface UpcomingInstallmentsParams {
  start_date: string;
  end_date: string;
  /** Defaults to false server-side; sent explicitly in both states regardless. */
  include_overdue?: boolean;
  /** Supported by the endpoint, unused by the current UI. */
  partner_id?: string;
  /** Supported by the endpoint, unused by the current UI. */
  limit?: number;
}

export type PeriodPresetId =
  | 'current-month'
  | 'previous-month'
  | 'current-quarter'
  | 'current-year'
  | 'next-30-days'
  | 'custom';