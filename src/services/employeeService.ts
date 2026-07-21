import { api, ApiError } from '../lib/api';
import {
  Employee,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  SalaryAdvance,
  CreateSalaryAdvanceRequest,
  SalarySummaryResponse,
  EmployeeWeeklySchedule,
  UpdateEmployeeWeeklyScheduleRequest,
  JustifiedAbsence,
  CreateJustifiedAbsenceRequest,
  AttendanceVerificationResponse,
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

  // Justified Absence
  listJustifiedAbsences: (params?: { employee_id?: string; month?: number; year?: number }) =>
    api.get<JustifiedAbsence[]>('/employees/justified-absences', { params }),
  createJustifiedAbsence: (payload: CreateJustifiedAbsenceRequest) =>
    api.post<void>('/employees/justified-absences', payload),
  deleteJustifiedAbsence: (id: string) =>
    api.delete(`/employees/justified-absences/${id}`),

  // Salary Advances
  listSalaryAdvances: (params?: { employee_id?: string; month?: number; year?: number }) =>
    api.get<SalaryAdvance[]>('/employees/salary-advances', { params }),
  createSalaryAdvance: (payload: CreateSalaryAdvanceRequest) =>
    api.post<SalaryAdvance>('/employees/salary-advances', payload),
  deleteSalaryAdvance: (id: string) =>
    api.delete(`/employees/salary-advances/${id}`),

  // Salary Summary report (per employee)
  getSalarySummary: (employee_id: string, params?: { month?: number; year?: number }) =>
    api.get<SalarySummaryResponse>(`/employees/salary-summary/${employee_id}`, { params }),

  // Self-service (current authenticated employee's own data).
  // Depends on a backend contract addition not yet implemented — see
  // specs/002-lateness-salary-visibility/contracts/employee-self-service-salary.md.
  getMySalarySummary: (params?: { month?: number; year?: number }) =>
    api.get<SalarySummaryResponse>('/employees/me/salary-summary', { params }),
  getMySalaryAdvances: (params?: { month?: number; year?: number }) =>
    api.get<SalaryAdvance[]>('/employees/me/salary-advances', { params }),
};
