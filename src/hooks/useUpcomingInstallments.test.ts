import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useUpcomingInstallments } from './useUpcomingInstallments';
import { loanService } from '../services/loanService';
import { periodPresetRange } from '../lib/formatters';
import { UpcomingInstallment } from '../types';

vi.mock('../services/loanService');

// Preset boundary maths is covered exhaustively (with frozen time) in
// formatters.test.ts. Here the ranges are derived at runtime instead, because
// fake timers would stall waitFor's polling.
const next30 = periodPresetRange('next-30-days');
const currentYear = periodPresetRange('current-year');

const row = (overrides: Partial<UpcomingInstallment> = {}): UpcomingInstallment => ({
  installment_id: 'i1',
  loan_id: 'l1',
  partner_id: 'p1',
  partner_name: 'João da Silva',
  installment_number: 1,
  due_date: next30.startDate,
  amount: '100.00',
  paid_amount: '0.00',
  remaining_amount: '100.00',
  status: 'PENDING',
  is_overdue: false,
  ...overrides,
});

describe('useUpcomingInstallments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('defaults to the next 30 days and fetches on mount', async () => {
    vi.mocked(loanService.getUpcomingInstallments).mockResolvedValue([row()]);

    const { result } = renderHook(() => useUpcomingInstallments());

    expect(result.current.startDate).toBe(next30.startDate);
    expect(result.current.endDate).toBe(next30.endDate);
    expect(result.current.preset).toBe('next-30-days');

    await waitFor(() => expect(result.current.installments).not.toBeNull());

    // include_overdue is sent explicitly even when false — a boolean false
    // survives api.ts's param guard, so the server default is never relied on.
    expect(loanService.getUpcomingInstallments).toHaveBeenCalledWith({
      start_date: next30.startDate,
      end_date: next30.endDate,
      include_overdue: false,
    });
    expect(result.current.loading).toBe(false);
  });

  it('does not fetch while the range is inverted', async () => {
    vi.mocked(loanService.getUpcomingInstallments).mockResolvedValue([row()]);

    const { result } = renderHook(() => useUpcomingInstallments());
    await waitFor(() => expect(result.current.installments).not.toBeNull());
    vi.mocked(loanService.getUpcomingInstallments).mockClear();

    await act(async () => {
      result.current.setRange('2026-08-31', '2026-08-01');
    });

    expect(result.current.invalidRange).toBe(true);
    expect(loanService.getUpcomingInstallments).not.toHaveBeenCalled();
    // Previously loaded rows stay on screen.
    expect(result.current.installments).toHaveLength(1);
  });

  it('surfaces an error message when the request fails', async () => {
    vi.mocked(loanService.getUpcomingInstallments).mockRejectedValue(
      new Error('Network down')
    );

    const { result } = renderHook(() => useUpcomingInstallments());

    await waitFor(() => expect(result.current.error).toBe('Network down'));
    expect(result.current.installments).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('discards a stale response that resolves after a newer one', async () => {
    const slow = [row({ installment_id: 'slow' })];
    const fast = [row({ installment_id: 'fast' })];

    let resolveSlow: (value: unknown) => void = () => {};
    const slowPromise = new Promise((resolve) => {
      resolveSlow = resolve;
    });

    vi.mocked(loanService.getUpcomingInstallments)
      .mockReturnValueOnce(slowPromise as never)
      .mockResolvedValueOnce(fast);

    const { result } = renderHook(() => useUpcomingInstallments());

    // Switch ranges before the first request settles.
    await act(async () => {
      result.current.applyPreset('current-year');
    });

    await waitFor(() => expect(result.current.installments).toEqual(fast));

    // The original, slower request now resolves — it must be ignored.
    await act(async () => {
      resolveSlow(slow);
      await slowPromise;
    });

    expect(result.current.installments).toEqual(fast);
  });

  it('applies a preset to both dates', async () => {
    vi.mocked(loanService.getUpcomingInstallments).mockResolvedValue([]);

    const { result } = renderHook(() => useUpcomingInstallments());

    await act(async () => {
      result.current.applyPreset('current-year');
    });

    expect(result.current.startDate).toBe(currentYear.startDate);
    expect(result.current.endDate).toBe(currentYear.endDate);
    expect(result.current.preset).toBe('current-year');
  });

  it('marks a manual date change as a custom preset', async () => {
    vi.mocked(loanService.getUpcomingInstallments).mockResolvedValue([]);

    const { result } = renderHook(() => useUpcomingInstallments());
    await waitFor(() => expect(result.current.installments).not.toBeNull());

    await act(async () => {
      result.current.setRange('2026-09-01', '2026-09-30');
    });

    expect(result.current.preset).toBe('custom');
  });

  it('separates "not yet loaded" from "loaded and empty"', async () => {
    vi.mocked(loanService.getUpcomingInstallments).mockResolvedValue([]);

    const { result } = renderHook(() => useUpcomingInstallments());

    // Before the first response lands, the empty state must not show.
    expect(result.current.installments).toBeNull();
    expect(result.current.isEmpty).toBe(false);

    await waitFor(() => expect(result.current.installments).toEqual([]));
    expect(result.current.isEmpty).toBe(true);
    expect(result.current.rowCount).toBe(0);
  });

  it('keeps rows on screen while refreshing rather than blanking them', async () => {
    let resolveSecond: (value: UpcomingInstallment[]) => void = () => {};
    const secondPromise = new Promise<UpcomingInstallment[]>((resolve) => {
      resolveSecond = resolve;
    });

    vi.mocked(loanService.getUpcomingInstallments)
      .mockResolvedValueOnce([row()])
      .mockReturnValueOnce(secondPromise as never);

    const { result } = renderHook(() => useUpcomingInstallments());
    await waitFor(() => expect(result.current.installments).toHaveLength(1));

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => expect(result.current.refreshing).toBe(true));
    // A refetch dims rather than blanks: rows stay, `loading` stays false.
    expect(result.current.loading).toBe(false);
    expect(result.current.installments).toHaveLength(1);

    await act(async () => {
      resolveSecond([]);
      await secondPromise;
    });

    expect(result.current.refreshing).toBe(false);
  });

  it('sums the outstanding total without float drift', async () => {
    vi.mocked(loanService.getUpcomingInstallments).mockResolvedValue([
      row({ installment_id: 'a', remaining_amount: '0.10' }),
      row({ installment_id: 'b', remaining_amount: '0.20' }),
      row({ installment_id: 'c', remaining_amount: '0.30' }),
    ]);

    const { result } = renderHook(() => useUpcomingInstallments());

    await waitFor(() => expect(result.current.rowCount).toBe(3));
    // Naive float accumulation yields 0.6000000000000001 here.
    expect(result.current.totalOutstanding).toBe(0.6);
  });

  it('starts with the overdue switch off', async () => {
    vi.mocked(loanService.getUpcomingInstallments).mockResolvedValue([]);

    const { result } = renderHook(() => useUpcomingInstallments());

    expect(result.current.includeOverdue).toBe(false);
    await waitFor(() => expect(result.current.installments).not.toBeNull());
  });

  it('refetches with include_overdue true when the switch is turned on', async () => {
    vi.mocked(loanService.getUpcomingInstallments).mockResolvedValue([]);

    const { result } = renderHook(() => useUpcomingInstallments());
    await waitFor(() => expect(result.current.installments).not.toBeNull());
    vi.mocked(loanService.getUpcomingInstallments).mockClear();

    await act(async () => {
      result.current.setIncludeOverdue(true);
    });

    await waitFor(() =>
      expect(loanService.getUpcomingInstallments).toHaveBeenCalledWith({
        start_date: next30.startDate,
        end_date: next30.endDate,
        include_overdue: true,
      })
    );
    expect(result.current.includeOverdue).toBe(true);
  });

  it('keeps the two filter axes independent', async () => {
    vi.mocked(loanService.getUpcomingInstallments).mockResolvedValue([]);

    const { result } = renderHook(() => useUpcomingInstallments());
    await waitFor(() => expect(result.current.installments).not.toBeNull());

    // Toggling the switch must not move the dates.
    await act(async () => {
      result.current.setIncludeOverdue(true);
    });
    expect(result.current.startDate).toBe(next30.startDate);
    expect(result.current.endDate).toBe(next30.endDate);

    // Changing the range must not reset the switch.
    await act(async () => {
      result.current.applyPreset('current-year');
    });
    expect(result.current.includeOverdue).toBe(true);

    await act(async () => {
      result.current.setRange('2026-09-01', '2026-09-30');
    });
    expect(result.current.includeOverdue).toBe(true);
  });

  it('counts only the rows the server flags as overdue', async () => {
    vi.mocked(loanService.getUpcomingInstallments).mockResolvedValue([
      row({ installment_id: 'a', is_overdue: true }),
      row({ installment_id: 'b', is_overdue: false }),
      row({ installment_id: 'c', is_overdue: true }),
    ]);

    const { result } = renderHook(() => useUpcomingInstallments());

    await waitFor(() => expect(result.current.rowCount).toBe(3));
    expect(result.current.overdueCount).toBe(2);
  });

  it('sums realistic amounts and counts rows', async () => {
    vi.mocked(loanService.getUpcomingInstallments).mockResolvedValue([
      row({ installment_id: 'a', remaining_amount: '1234.56' }),
      row({ installment_id: 'b', remaining_amount: '0.00' }),
      row({ installment_id: 'c', remaining_amount: '765.44' }),
    ]);

    const { result } = renderHook(() => useUpcomingInstallments());

    await waitFor(() => expect(result.current.rowCount).toBe(3));
    expect(result.current.totalOutstanding).toBe(2000);
    expect(result.current.isEmpty).toBe(false);
  });
});
