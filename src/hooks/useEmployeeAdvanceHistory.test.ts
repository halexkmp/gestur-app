import { renderHook, act, waitFor } from '@testing-library/react';
import { useEmployeeAdvanceHistory } from './useEmployeeAdvanceHistory';
import { employeeService } from '../services/employeeService';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { SalaryAdvance } from '../types';

vi.mock('../services/employeeService');

const advance = (overrides: Partial<SalaryAdvance>): SalaryAdvance => ({
  id: 'a1',
  employee_id: 'e1',
  amount: 100,
  created_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

describe('useEmployeeAdvanceHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch the complete history on mount, sorted most-recent-first, with the correct total', async () => {
    vi.mocked(employeeService.listSalaryAdvances).mockResolvedValue([
      advance({ id: 'a1', amount: 100, advance_date: '2026-03-15' }),
      advance({ id: 'a2', amount: 50, advance_date: '2026-07-20' }),
      advance({ id: 'a3', amount: 25, advance_date: '2026-01-01' }),
    ]);

    const { result } = renderHook(() => useEmployeeAdvanceHistory('e1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(employeeService.listSalaryAdvances).toHaveBeenCalledWith('e1');
    expect(result.current.advances.map(a => a.id)).toEqual(['a2', 'a1', 'a3']);
    expect(result.current.total).toBe(175);
    expect(result.current.error).toBe(false);
  });

  it('should sort an advance with no advance_date to the end', async () => {
    vi.mocked(employeeService.listSalaryAdvances).mockResolvedValue([
      advance({ id: 'no-date', amount: 10, advance_date: null }),
      advance({ id: 'dated', amount: 20, advance_date: '2026-01-01' }),
    ]);

    const { result } = renderHook(() => useEmployeeAdvanceHistory('e1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.advances.map(a => a.id)).toEqual(['dated', 'no-date']);
  });

  it('should return an empty list and zero total when the employee has no advances', async () => {
    vi.mocked(employeeService.listSalaryAdvances).mockResolvedValue([]);

    const { result } = renderHook(() => useEmployeeAdvanceHistory('e1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.advances).toEqual([]);
    expect(result.current.total).toBe(0);
    expect(result.current.error).toBe(false);
  });

  it('should set error and clear the list when the fetch fails', async () => {
    vi.mocked(employeeService.listSalaryAdvances).mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() => useEmployeeAdvanceHistory('e1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe(true);
    expect(result.current.advances).toEqual([]);
    expect(result.current.total).toBe(0);
  });

  it('reload should re-run the fetch', async () => {
    vi.mocked(employeeService.listSalaryAdvances).mockResolvedValue([advance({})]);

    const { result } = renderHook(() => useEmployeeAdvanceHistory('e1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(employeeService.listSalaryAdvances).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.reload();
    });

    expect(employeeService.listSalaryAdvances).toHaveBeenCalledTimes(2);
  });
});
