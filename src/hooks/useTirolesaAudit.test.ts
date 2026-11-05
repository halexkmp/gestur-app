import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useTirolesaAudit } from './useTirolesaAudit';
import { tirolesaService } from '../services/tirolesaService';
import { shiftISODate, toISODateLocal } from '../lib/formatters';
import { TirolesaAuditDay } from '../types';

vi.mock('../services/tirolesaService');

const today = toISODateLocal(new Date());
const yesterday = shiftISODate(today, -1);
const twoDaysAgo = shiftISODate(today, -2);

const row = (date: string): TirolesaAuditDay => ({
  date,
  descents_detected: 1,
  descents_sold: 1,
  descents_below_default_price: 0,
  descents_justified: 0,
  unexplained: 0,
  sold_above_detected: 0,
  sales_amount: 50,
  estimated_unpaid_value: 0,
  status: 'BALANCED',
  device_hours: 8,
  clock_suspect_trips: 0,
  sensor_warning: false,
  justifications: [],
});

const mountOnYesterday = async () => {
  const hook = renderHook(() => useTirolesaAudit());
  await waitFor(() => expect(hook.result.current.day?.date).toBe(yesterday));
  return hook;
};

describe('useTirolesaAudit', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(tirolesaService.getAuditDay).mockImplementation(async (date) => row(date));
  });

  it('opens on yesterday and fetches it', async () => {
    const { result } = await mountOnYesterday();

    expect(result.current.selectedDate).toBe(yesterday);
    expect(result.current.isYesterday).toBe(true);
    expect(result.current.isToday).toBe(false);
    expect(tirolesaService.getAuditDay).toHaveBeenCalledWith(yesterday);
  });

  it('moves back a day', async () => {
    const { result } = await mountOnYesterday();

    act(() => result.current.goToPreviousDay());

    await waitFor(() => expect(result.current.day?.date).toBe(twoDaysAgo));
  });

  it('never moves past today', async () => {
    const { result } = await mountOnYesterday();

    act(() => result.current.goToNextDay());
    await waitFor(() => expect(result.current.day?.date).toBe(today));
    expect(result.current.isToday).toBe(true);

    act(() => result.current.goToNextDay());

    expect(result.current.selectedDate).toBe(today);
    expect(tirolesaService.getAuditDay).toHaveBeenCalledTimes(2);
  });

  it('returns to yesterday', async () => {
    const { result } = await mountOnYesterday();

    act(() => result.current.goToPreviousDay());
    await waitFor(() => expect(result.current.day?.date).toBe(twoDaysAgo));
    act(() => result.current.goToYesterday());

    await waitFor(() => expect(result.current.day?.date).toBe(yesterday));
  });

  it('ignores an older response', async () => {
    const { result } = await mountOnYesterday();

    let finishOlder: (day: TirolesaAuditDay) => void = () => {};
    vi.mocked(tirolesaService.getAuditDay).mockImplementationOnce(
      () => new Promise((resolve) => { finishOlder = resolve; }),
    );
    act(() => result.current.goToPreviousDay());
    act(() => result.current.goToYesterday());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => finishOlder(row(twoDaysAgo)));

    expect(result.current.day?.date).toBe(yesterday);
  });

  it('clears the day on a failed load', async () => {
    const { result } = await mountOnYesterday();

    vi.mocked(tirolesaService.getAuditDay).mockRejectedValueOnce(new Error('falhou'));
    await act(async () => result.current.reload());

    expect(result.current.day).toBeNull();
    expect(result.current.error).toBe('falhou');
  });

  it('saves for the selected day with a trimmed reason, then reloads', async () => {
    const { result } = await mountOnYesterday();
    vi.mocked(tirolesaService.createJustification).mockResolvedValue(undefined);

    await act(async () => result.current.addJustification(2, 'TEST', '  verificação  '));

    expect(tirolesaService.createJustification).toHaveBeenCalledWith({
      audit_date: yesterday,
      quantity: 2,
      type: 'TEST',
      reason: 'verificação',
    });
    expect(tirolesaService.getAuditDay).toHaveBeenCalledTimes(2);
  });

  it('rethrows a failed save', async () => {
    const { result } = await mountOnYesterday();
    vi.mocked(tirolesaService.createJustification).mockRejectedValue(new Error('não salvou'));

    await expect(result.current.addJustification(1, 'OTHER', 'x')).rejects.toThrow('não salvou');
    expect(tirolesaService.getAuditDay).toHaveBeenCalledTimes(1);
  });

  it('reloads after removing a justification', async () => {
    const { result } = await mountOnYesterday();
    vi.mocked(tirolesaService.deleteJustification).mockResolvedValue(undefined);

    await act(async () => result.current.removeJustification('j1'));

    expect(tirolesaService.deleteJustification).toHaveBeenCalledWith('j1');
    expect(tirolesaService.getAuditDay).toHaveBeenCalledTimes(2);
  });
});
