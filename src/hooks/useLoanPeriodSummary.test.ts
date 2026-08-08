import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useLoanPeriodSummary } from './useLoanPeriodSummary';
import { loanService } from '../services/loanService';
import { periodPresetRange } from '../lib/formatters';

vi.mock('../services/loanService');

// Preset boundary maths is covered exhaustively (with frozen time) in
// formatters.test.ts. Here the ranges are derived at runtime instead, because
// fake timers would stall waitFor's polling.
const currentMonth = periodPresetRange('current-month');
const currentYear = periodPresetRange('current-year');

const summaryFor = (start: string, end: string) => ({
  start_date: start,
  end_date: end,
  expected_revenue: '1000.00',
  expected_capital: '800.00',
  expected_profit: '200.00',
  received_amount: '400.00',
  outstanding_amount: '600.00',
  installments_count: 4,
  partners_count: 2,
  partners: [],
});

describe('useLoanPeriodSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('defaults to the current calendar month and fetches on mount', async () => {
    vi.mocked(loanService.getPeriodSummary).mockResolvedValue(
      summaryFor(currentMonth.startDate, currentMonth.endDate) as never
    );

    const { result } = renderHook(() => useLoanPeriodSummary());

    expect(result.current.startDate).toBe(currentMonth.startDate);
    expect(result.current.endDate).toBe(currentMonth.endDate);

    await waitFor(() => expect(result.current.summary).not.toBeNull());

    expect(loanService.getPeriodSummary).toHaveBeenCalledWith({
      start_date: currentMonth.startDate,
      end_date: currentMonth.endDate,
    });
    expect(result.current.loading).toBe(false);
  });

  it('does not fetch while the range is inverted', async () => {
    vi.mocked(loanService.getPeriodSummary).mockResolvedValue(
      summaryFor(currentMonth.startDate, currentMonth.endDate) as never
    );

    const { result } = renderHook(() => useLoanPeriodSummary());
    await waitFor(() => expect(result.current.summary).not.toBeNull());
    vi.mocked(loanService.getPeriodSummary).mockClear();

    await act(async () => {
      result.current.setRange('2026-08-31', '2026-08-01');
    });

    expect(result.current.invalidRange).toBe(true);
    expect(loanService.getPeriodSummary).not.toHaveBeenCalled();
    // Previously loaded figures stay on screen.
    expect(result.current.summary).not.toBeNull();
  });

  it('surfaces an error message when the request fails', async () => {
    vi.mocked(loanService.getPeriodSummary).mockRejectedValue(
      new Error('Network down')
    );

    const { result } = renderHook(() => useLoanPeriodSummary());

    await waitFor(() => expect(result.current.error).toBe('Network down'));
    expect(result.current.summary).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('discards a stale response that resolves after a newer one', async () => {
    const slow = summaryFor(currentMonth.startDate, currentMonth.endDate);
    const fast = summaryFor(currentYear.startDate, currentYear.endDate);

    let resolveSlow: (value: unknown) => void = () => {};
    const slowPromise = new Promise((resolve) => {
      resolveSlow = resolve;
    });

    vi.mocked(loanService.getPeriodSummary)
      .mockReturnValueOnce(slowPromise as never)
      .mockResolvedValueOnce(fast as never);

    const { result } = renderHook(() => useLoanPeriodSummary());

    // Switch ranges before the first request settles.
    await act(async () => {
      result.current.applyPreset('current-year');
    });

    await waitFor(() => expect(result.current.summary).toEqual(fast));

    // The original, slower request now resolves — it must be ignored.
    await act(async () => {
      resolveSlow(slow);
      await slowPromise;
    });

    expect(result.current.summary).toEqual(fast);
  });

  it('applies a preset to both dates', async () => {
    vi.mocked(loanService.getPeriodSummary).mockResolvedValue(
      summaryFor(currentYear.startDate, currentYear.endDate) as never
    );

    const { result } = renderHook(() => useLoanPeriodSummary());

    await act(async () => {
      result.current.applyPreset('current-year');
    });

    expect(result.current.startDate).toBe(currentYear.startDate);
    expect(result.current.endDate).toBe(currentYear.endDate);
    expect(result.current.preset).toBe('current-year');
  });
});
