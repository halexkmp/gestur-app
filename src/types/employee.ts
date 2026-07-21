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

export interface EmployeePaycheck {
  employee_id: string;
  employee_name: string;
  base_salary: number | string;
  // Everything below comes from the per-employee salary-summary endpoint and is only
  // populated once the row has been expanded (see useEmployeePaychecks.loadSummaryForEmployee).
  month?: number;
  year?: number;
  gross_salary?: number | string;
  advances_total?: number | string;
  late_delay_minutes?: number;
  late_days_count?: number;
  late_deduction_total?: number | string;
  net_salary?: number | string;
}

export interface EmployeeWeeklySchedule {
  employee_id: string;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
}

export interface UpdateEmployeeWeeklyScheduleRequest {
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
}

export interface JustifiedAbsence {
  id: string;
  employee_id: string;
  absence_date: string; // ISO date
  reason?: string | null;
  created_at: string;
}

export interface CreateJustifiedAbsenceRequest {
  employee_id: string;
  absence_date: string; // ISO date
  reason?: string | null;
}

export type AttendanceDayStatus = 'PRESENT' | 'JUSTIFIED_ABSENCE' | 'UNJUSTIFIED_ABSENCE';

export interface AttendanceDay {
  date: string; // ISO date
  status: AttendanceDayStatus;
}

export interface AttendanceVerificationResponse {
  employee_id: string;
  month: number;
  year: number;
  days: AttendanceDay[];
  unjustified_absence_count: number;
}

export interface ScheduleOverviewItem {
  employee_id: string;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
  month: number;
  year: number;
  days: AttendanceDay[];
  unjustified_absence_count: number;
}

export interface ScheduleOverviewResponse {
  items: ScheduleOverviewItem[];
}

// Client-side view model — never sent to or received from the backend. See
// specs/005-hr-schedule-tab/data-model.md for the derivation rules that produce these.
export type CalendarCellState =
  | 'WORKED'
  | 'JUSTIFIED_ABSENCE'
  | 'UNJUSTIFIED_ABSENCE'
  | 'NOT_SCHEDULED'
  | 'NO_DATA';

export interface CalendarDayCell {
  date: string; // ISO date (yyyy-MM-dd)
  state: CalendarCellState;
  detail?: string; // human-readable reason shown in a tooltip
}

export interface EmployeeScheduleRow {
  employee: Employee;
  hasSchedule: boolean;
  days: CalendarDayCell[];
  unjustifiedAbsenceCount: number;
}
