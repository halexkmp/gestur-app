import { renderHook, act, waitFor } from '@testing-library/react';
import { useEmployeePaychecks } from './useEmployeePaychecks';
import { employeeService } from '../services/employeeService';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Employee, SalaryAdvance, SalarySummaryOverviewItem, SalarySummaryOverviewResponse } from '../types';

vi.mock('../services/employeeService');

const employee = (overrides: Partial<Employee>): Employee => ({
  id: 'e1',
  name: 'Alice',
  salary: 1000,
  active: true,
  ...overrides,
});

const overviewItem = (overrides: Partial<SalarySummaryOverviewItem>): SalarySummaryOverviewItem => ({
  employee_id: 'e1',
  month: 7,
  year: 2026,
  gross_salary: 1000,
  advances_total: 0,
  late_delay_minutes: 0,
  late_days_count: 0,
  late_deduction_total: 0,
  net_salary: 1000,
  advances: [],
  ...overrides,
});

const overviewResponse = (items: SalarySummaryOverviewItem[]): SalarySummaryOverviewResponse => ({ items });

describe('useEmployeePaychecks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch active employees and the bulk salary summary overview on mount, merging by employee_id', async () => {
    const employees = [employee({ id: 'e1', name: 'Alice', active: true, salary: 1000 }), employee({ id: 'e2', name: 'Bob', active: false, salary: 900 })];
    vi.mocked(employeeService.getAll).mockResolvedValue(employees);
    const summary = overviewItem({});
    vi.mocked(employeeService.getSalarySummaryOverview).mockResolvedValue(overviewResponse([summary]));

    const { result } = renderHook(() => useEmployeePaychecks());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(employeeService.getAll).toHaveBeenCalledTimes(1);
    expect(employeeService.getSalarySummaryOverview).toHaveBeenCalledTimes(1);
    expect(employeeService.getSalarySummaryOverview).toHaveBeenCalledWith({ month: 7, year: 2026 });
    expect(result.current.paychecks).toEqual([
      { employee_name: 'Alice', base_salary: 1000, ...summary },
    ]);
    expect(result.current.error).toBe(false);
  });

  it('should fall back to base_salary only when the overview has no matching item for an active employee', async () => {
    vi.mocked(employeeService.getAll).mockResolvedValue([employee({})]);
    vi.mocked(employeeService.getSalarySummaryOverview).mockResolvedValue(overviewResponse([]));

    const { result } = renderHook(() => useEmployeePaychecks());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.paychecks).toEqual([
      { employee_id: 'e1', employee_name: 'Alice', base_salary: 1000 },
    ]);
  });

  it('should set error and clear paychecks when a fetch fails', async () => {
    vi.mocked(employeeService.getAll).mockRejectedValue(new Error('network error'));
    vi.mocked(employeeService.getSalarySummaryOverview).mockResolvedValue(overviewResponse([]));

    const { result } = renderHook(() => useEmployeePaychecks());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe(true);
    expect(result.current.paychecks).toEqual([]);
  });

  it('should refetch employees and the overview when month or year changes', async () => {
    vi.mocked(employeeService.getAll).mockResolvedValue([employee({})]);
    vi.mocked(employeeService.getSalarySummaryOverview).mockResolvedValue(overviewResponse([]));

    const { result } = renderHook(() => useEmployeePaychecks());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setMonth(6);
    });

    await waitFor(() => expect(employeeService.getAll).toHaveBeenCalledTimes(2));
    expect(employeeService.getSalarySummaryOverview).toHaveBeenCalledTimes(2);
    expect(employeeService.getSalarySummaryOverview).toHaveBeenLastCalledWith({ month: 6, year: 2026 });
  });

  it("should merge each item's embedded advances directly onto the matching paycheck", async () => {
    vi.mocked(employeeService.getAll).mockResolvedValue([employee({})]);
    const advances = [{ id: 'a1', amount: 100, advance_date: '2026-07-01', note: null }];
    vi.mocked(employeeService.getSalarySummaryOverview).mockResolvedValue(overviewResponse([
      overviewItem({ gross_salary: 1000, advances_total: 100, net_salary: 900, advances }),
    ]));

    const { result } = renderHook(() => useEmployeePaychecks());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.paychecks[0].advances).toEqual(advances);
  });

  it('createAdvance should call the service then refetch the bulk overview', async () => {
    vi.mocked(employeeService.getAll).mockResolvedValue([employee({})]);
    vi.mocked(employeeService.getSalarySummaryOverview).mockResolvedValue(overviewResponse([]));
    const createdAdvance: SalaryAdvance = { id: 'a1', employee_id: 'e1', amount: 100, created_at: '2026-07-01' };
    vi.mocked(employeeService.createSalaryAdvance).mockResolvedValue(createdAdvance);

    const { result } = renderHook(() => useEmployeePaychecks());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createAdvance({ employee_id: 'e1', amount: 100, times: 1 });
    });

    expect(employeeService.createSalaryAdvance).toHaveBeenCalledWith({ employee_id: 'e1', amount: 100, times: 1 });
    expect(employeeService.getAll).toHaveBeenCalledTimes(2);
    expect(employeeService.getSalarySummaryOverview).toHaveBeenCalledTimes(2);
  });

  it('deleteAdvance should call the service then refetch the bulk overview', async () => {
    vi.mocked(employeeService.getAll).mockResolvedValue([employee({})]);
    vi.mocked(employeeService.getSalarySummaryOverview).mockResolvedValue(overviewResponse([]));
    vi.mocked(employeeService.deleteSalaryAdvance).mockResolvedValue(undefined);

    const { result } = renderHook(() => useEmployeePaychecks());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.deleteAdvance('a1');
    });

    expect(employeeService.deleteSalaryAdvance).toHaveBeenCalledWith('a1');
    expect(employeeService.getAll).toHaveBeenCalledTimes(2);
    expect(employeeService.getSalarySummaryOverview).toHaveBeenCalledTimes(2);
  });
});
