export interface Employee {
  id: string;
  name: string;
  pix_key?: string | null;
  salary: number;
  active: boolean;
}

export interface CreateEmployeeRequest {
  name: string;
  pix_key?: string | null;
  salary: number;
  active?: boolean;
}

export interface UpdateEmployeeRequest {
  name?: string;
  pix_key?: string | null;
  salary?: number;
  active?: boolean;
}

export interface SalaryAdvance {
  id: string;
  employee_id: string;
  amount: number | string;
  created_at: string; // ISO date
  note?: string | null;
}

export interface CreateSalaryAdvanceRequest {
  employee_id: string;
  amount: number | string;
  note?: string | null;
}

export interface SalarySummaryResponse {
  employee_id: string;
  month: number;
  year: number;
  gross_salary: number | string;
  advances_total: number | string;
  net_salary: number | string;
}
