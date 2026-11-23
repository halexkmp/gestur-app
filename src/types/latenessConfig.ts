export interface LatenessConfig {
  enabled: boolean;
  expected_entrance_time: string; // "HH:MM:SS" local wall-clock in app state; GET/PUT wire format is UTC, optionally with "Z" or a "±HH:MM" offset
  tolerance_minutes: number;
  deduction_interval_minutes: number;
  deduction_value: number;
  late_penalty_hours: number; // hours of pay lost per late day, 0 <= x < 1000
  monthly_work_hours: number; // divisor for the hourly rate (salary / monthly_work_hours), > 0
}
