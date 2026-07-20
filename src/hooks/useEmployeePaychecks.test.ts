import { renderHook, act, waitFor } from '@testing-library/react';
import { useEmployeePaychecks } from './useEmployeePaychecks';
import { employeeService } from '../services/employeeService';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../services/employeeService');

describe('useEmployeePaychecks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch active employees and compose their paychecks on mount', async () => {
    const employees = [
      { id: 'e1', name: 'Alice', active: true, salary: 1000 },
      { id: 'e2', name: 'Bob', active: false, salary: 900 },
    ];
    const summary = {
      employee_id: 'e1',
      month: 7,
      year: 2026,
      gross_salary: 1000,
      advances_total: 0,
      late_delay_minutes: 0,
      late_days_count: 0,
      late_deduction_total: 0,
      net_salary: 1000,
    };
    vi.mocked(employeeService.getAll).mockResolvedValue(employees as any);
    vi.mocked(employeeService.getSalarySummary).mockResolvedValue(summary as any);

    const { result } = renderHook(() => useEmployeePaychecks());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(employeeService.getSalarySummary).toHaveBeenCalledTimes(1);
    expect(employeeService.getSalarySummary).toHaveBeenCalledWith('e1', { month: 7, year: 2026 });
    expect(result.current.paychecks).toEqual([
      { employee_id: 'e1', employee_name: 'Alice', ...summary },
    ]);
    expect(result.current.error).toBe(false);
  });

  it('should set error and clear paychecks when a fetch fails', async () => {
    vi.mocked(employeeService.getAll).mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() => useEmployeePaychecks());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe(true);
    expect(result.current.paychecks).toEqual([]);
  });

  it('should refetch when month or year changes', async () => {
    vi.mocked(employeeService.getAll).mockResolvedValue([{ id: 'e1', name: 'Alice', active: true }] as any);
    vi.mocked(employeeService.getSalarySummary).mockResolvedValue({
      employee_id: 'e1', month: 7, year: 2026, gross_salary: 1000, advances_total: 0,
      late_delay_minutes: 0, late_days_count: 0, late_deduction_total: 0, net_salary: 1000,
    } as any);

    const { result } = renderHook(() => useEmployeePaychecks());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setMonth(6);
    });

    await waitFor(() => {
      expect(employeeService.getSalarySummary).toHaveBeenCalledWith('e1', { month: 6, year: 2026 });
    });
  });

  it('getAdvancesForEmployee should return undefined until loadAdvancesForEmployee resolves, then the list', async () => {
    vi.mocked(employeeService.getAll).mockResolvedValue([{ id: 'e1', name: 'Alice', active: true }] as any);
    vi.mocked(employeeService.getSalarySummary).mockResolvedValue({
      employee_id: 'e1', month: 7, year: 2026, gross_salary: 1000, advances_total: 0,
      late_delay_minutes: 0, late_days_count: 0, late_deduction_total: 0, net_salary: 1000,
    } as any);
    const advances = [{ id: 'a1', employee_id: 'e1', amount: 100, created_at: '2026-07-01' }];
    vi.mocked(employeeService.listSalaryAdvances).mockResolvedValue(advances as any);

    const { result } = renderHook(() => useEmployeePaychecks());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.getAdvancesForEmployee('e1')).toBeUndefined();

    await act(async () => {
      await result.current.loadAdvancesForEmployee('e1');
    });

    expect(result.current.getAdvancesForEmployee('e1')).toEqual(advances);
  });

  it('createAdvance should call the service then refresh that employee summary and advances', async () => {
    vi.mocked(employeeService.getAll).mockResolvedValue([{ id: 'e1', name: 'Alice', active: true }] as any);
    vi.mocked(employeeService.getSalarySummary).mockResolvedValue({
      employee_id: 'e1', month: 7, year: 2026, gross_salary: 1000, advances_total: 0,
      late_delay_minutes: 0, late_days_count: 0, late_deduction_total: 0, net_salary: 1000,
    } as any);
    vi.mocked(employeeService.listSalaryAdvances).mockResolvedValue([] as any);
    vi.mocked(employeeService.createSalaryAdvance).mockResolvedValue(undefined as any);

    const { result } = renderHook(() => useEmployeePaychecks());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createAdvance({ employee_id: 'e1', amount: 100, times: 1 });
    });

    expect(employeeService.createSalaryAdvance).toHaveBeenCalledWith({ employee_id: 'e1', amount: 100, times: 1 });
    expect(employeeService.getSalarySummary).toHaveBeenCalledTimes(2);
    expect(employeeService.listSalaryAdvances).toHaveBeenCalledWith({ employee_id: 'e1', month: 7, year: 2026 });
  });

  it('deleteAdvance should call the service then refresh that employee summary and advances', async () => {
    vi.mocked(employeeService.getAll).mockResolvedValue([{ id: 'e1', name: 'Alice', active: true }] as any);
    vi.mocked(employeeService.getSalarySummary).mockResolvedValue({
      employee_id: 'e1', month: 7, year: 2026, gross_salary: 1000, advances_total: 0,
      late_delay_minutes: 0, late_days_count: 0, late_deduction_total: 0, net_salary: 1000,
    } as any);
    vi.mocked(employeeService.listSalaryAdvances).mockResolvedValue([] as any);
    vi.mocked(employeeService.deleteSalaryAdvance).mockResolvedValue(undefined as any);

    const { result } = renderHook(() => useEmployeePaychecks());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.deleteAdvance('a1', 'e1');
    });

    expect(employeeService.deleteSalaryAdvance).toHaveBeenCalledWith('a1');
    expect(employeeService.getSalarySummary).toHaveBeenCalledTimes(2);
  });
});
