import { api, ApiError } from '../lib/api';
import {
  Employee,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  SalaryAdvance,
  CreateSalaryAdvanceRequest,
  SalarySummaryResponse,
  SalarySummaryOverviewResponse,
  EmployeeWeeklySchedule,
  UpdateEmployeeWeeklyScheduleRequest,
  JustifiedAbsence,
  CreateJustifiedAbsenceRequest,
  AttendanceVerificationResponse,
  ScheduleOverviewResponse,
} from '../types';

export const employeeService = {
  // Employees CRUD
  getAll: () => api.get<Employee[]>('/employees/'),
  getById: (id: string) => api.get<Employee>(`/employees/${id}`),
  create: (payload: CreateEmployeeRequest) => api.post<Employee>('/employees/', payload),
  update: (id: string, payload: UpdateEmployeeRequest) => api.put<Employee>(`/employees/${id}`, payload),
  delete: (id: string) => api.delete(`/employees/${id}`),

  // Employee Weekly Schedule
  getSchedule: async (employee_id: string): Promise<EmployeeWeeklySchedule | null> => {
    try {
      return await api.get<EmployeeWeeklySchedule>(`/employees/schedule/${employee_id}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    }
  },
  updateSchedule: (employee_id: string, payload: UpdateEmployeeWeeklyScheduleRequest) =>
    api.put<EmployeeWeeklySchedule>(`/employees/schedule/${employee_id}`, payload),

  // Attendance Verification
  getAttendanceVerification: (employee_id: string, params: { month: number; year: number }) =>
    api.get<AttendanceVerificationResponse>(`/employees/attendance-verification/${employee_id}`, { params }),

  // Employee Schedule Overview (Bulk) — consolidates the two endpoints above for many
  // employees into a single call. `employee_ids` is intentionally not exposed here since
  // `api.ts`'s query-param serializer doesn't support repeated keys for arrays, and every
  // current caller wants "all employees" anyway (the endpoint's own default when omitted).
  getScheduleOverview: (params?: { month?: number; year?: number }) =>
    api.get<ScheduleOverviewResponse>('/employees/schedule-overview', { params }),

  // Justified Absence
  listJustifiedAbsences: (params?: { employee_id?: string; month?: number; year?: number }) =>
    api.get<JustifiedAbsence[]>('/employees/justified-absences', { params }),
  createJustifiedAbsence: (payload: CreateJustifiedAbsenceRequest) =>
    api.post<void>('/employees/justified-absences', payload),
  deleteJustifiedAbsence: (id: string) =>
    api.delete(`/employees/justified-absences/${id}`),

  // Salary Advances
  createSalaryAdvance: (payload: CreateSalaryAdvanceRequest) =>
    api.post<SalaryAdvance>('/employees/salary-advances', payload),
  deleteSalaryAdvance: (id: string) =>
    api.delete(`/employees/salary-advances/${id}`),

  // Salary Summary (All Employees) — consolidates the per-employee summary and advances
  // lookups into a single call for every employee in the system for a given month/year (the
  // caller is responsible for filtering to active employees). Path is /employees/salary-summary
  // with no path param — the old single-employee {employee_id} form was removed by the
  // backend, not kept alongside this one.
  getSalarySummaryOverview: (params?: { month?: number; year?: number }) =>
    api.get<SalarySummaryOverviewResponse>('/employees/salary-summary', { params }),

  // Self-service (current authenticated employee's own data).
  // Depends on a backend contract addition not yet implemented — see
  // specs/002-lateness-salary-visibility/contracts/employee-self-service-salary.md.
  getMySalarySummary: (params?: { month?: number; year?: number }) =>
    api.get<SalarySummaryResponse>('/employees/me/salary-summary', { params }),
  getMySalaryAdvances: (params?: { month?: number; year?: number }) =>
    api.get<SalaryAdvance[]>('/employees/me/salary-advances', { params }),
};
