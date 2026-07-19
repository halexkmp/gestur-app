export interface LatenessConfig {
  enabled: boolean;
  expected_entrance_time: string; // "HH:MM:SS" local wall-clock in app state; GET/PUT wire format is UTC, optionally with "Z" or a "±HH:MM" offset
  tolerance_minutes: number;
  deduction_interval_minutes: number;
  deduction_value: number;
}
