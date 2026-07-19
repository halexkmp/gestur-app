export interface Employee {
  id: string;
  name: string;
  pix_key?: string | null;
  salary: number;
  active: boolean;
  start_date?: string | null; // ISO date
  user_id?: string | null; // id of the linked User account, or null/absent if none
}

export interface CreateEmployeeRequest {
  name: string;
  pix_key?: string | null;
  salary: number;
  active?: boolean;
  start_date?: string | null; // ISO date
  user_id?: string | null; // optional link to an existing User account
}

export interface UpdateEmployeeRequest {
  name?: string;
  pix_key?: string | null;
  salary?: number;
  active?: boolean;
  start_date?: string | null; // ISO date
  // omitted = leave link unchanged; "<uuid>" = set/replace; null = explicitly clear
  user_id?: string | null;
}

export interface SalaryAdvance {
  id: string;
  employee_id: string;
  amount: number | string;
  created_at: string; // ISO date
  advance_date?: string | null; // ISO date
  note?: string | null;
  times?: number;
}

export interface CreateSalaryAdvanceRequest {
  employee_id: string;
  amount: number | string;
  advance_date?: string | null; // ISO date
  note?: string | null;
  times?: number;
}

export interface SalarySummaryResponse {
  employee_id: string;
  month: number;
  year: number;
  gross_salary: number | string;
  advances_total: number | string;
  late_delay_minutes: number;
  late_days_count: number;
  late_deduction_total: number | string;
  net_salary: number | string;
}
