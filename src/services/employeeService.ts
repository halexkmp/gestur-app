import { api } from '../lib/api';
import { Employee, CreateEmployeeRequest, UpdateEmployeeRequest, SalaryAdvance, CreateSalaryAdvanceRequest, SalarySummaryResponse } from '../types';

export const employeeService = {
  // Employees CRUD
  getAll: () => api.get<Employee[]>('/employees/'),
  getById: (id: string) => api.get<Employee>(`/employees/${id}`),
  create: (payload: CreateEmployeeRequest) => api.post<Employee>('/employees/', payload),
  update: (id: string, payload: UpdateEmployeeRequest) => api.put<Employee>(`/employees/${id}`, payload),
  delete: (id: string) => api.delete(`/employees/${id}`),

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
};
