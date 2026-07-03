import { renderHook, act } from '@testing-library/react';
import { useLoans } from './useLoans';
import { loanService } from '../services/loanService';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../services/loanService');

describe('useLoans', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should auto-fetch loans when partnerId is provided', async () => {
    const mockLoans = [
      { id: 'l1', partner_id: 'p1', principal_amount: 1000 }
    ];
    vi.mocked(loanService.getByPartner).mockResolvedValue(mockLoans as any);

    const { result } = renderHook(() => useLoans('p1'));

    await act(async () => {
      // wait for effect
    });

    expect(loanService.getByPartner).toHaveBeenCalledWith('p1');
    expect(result.current.loans).toEqual(mockLoans);
    expect(result.current.loading).toBe(false);
  });

  it('should not auto-fetch and return empty array when partnerId is missing', async () => {
    const { result } = renderHook(() => useLoans());

    expect(loanService.getByPartner).not.toHaveBeenCalled();
    expect(result.current.loans).toEqual([]);
  });

  it('should fetch loan details and update the loans array', async () => {
    const mockLoans = [
      { id: 'l1', partner_id: 'p1', principal_amount: 1000 },
      { id: 'l2', partner_id: 'p1', principal_amount: 2000 }
    ];
    const detailedLoan = {
      id: 'l1',
      partner_id: 'p1',
      principal_amount: 1000,
      installments_list: [{ id: 'inst1', amount: 200, paid: false }]
    };

    vi.mocked(loanService.getByPartner).mockResolvedValue(mockLoans as any);
    vi.mocked(loanService.getById).mockResolvedValue(detailedLoan as any);

    const { result } = renderHook(() => useLoans('p1'));

    await act(async () => {
      await result.current.fetchLoanDetails('l1');
    });

    expect(loanService.getById).toHaveBeenCalledWith('l1');
    expect(result.current.loans).toEqual([
      detailedLoan,
      mockLoans[1]
    ]);
  });

  it('should handle createLoan and trigger fetchLoans', async () => {
    const initialLoans = [{ id: 'l1', partner_id: 'p1', principal_amount: 1000 }];
    const newLoan = { id: 'l2', partner_id: 'p1', principal_amount: 500 };
    const updatedLoans = [...initialLoans, newLoan];

    vi.mocked(loanService.getByPartner)
      .mockResolvedValueOnce(initialLoans as any)
      .mockResolvedValueOnce(updatedLoans as any);
    vi.mocked(loanService.create).mockResolvedValue(newLoan as any);

    const { result } = renderHook(() => useLoans('p1'));

    let created;
    await act(async () => {
      created = await result.current.createLoan({
        partner_id: 'p1',
        principal_amount: 500,
        interest_rate: 10,
        installments: 1,
        due_day: 5,
        start_date: '2026-07-01',
        end_date: '2026-08-01',
      });
    });

    expect(created).toEqual(newLoan);
    expect(loanService.create).toHaveBeenCalled();
    expect(result.current.loans).toEqual(updatedLoans);
  });

  it('should handle payInstallment and fetch loan details', async () => {
    const mockLoans = [
      { id: 'l1', partner_id: 'p1', principal_amount: 1000, installments_list: [{ id: 'inst1', paid: false }] }
    ];
    const updatedDetailedLoan = {
      id: 'l1',
      partner_id: 'p1',
      principal_amount: 1000,
      installments_list: [{ id: 'inst1', paid: true, payment_date: '2026-07-01' }]
    };

    vi.mocked(loanService.getByPartner).mockResolvedValue(mockLoans as any);
    vi.mocked(loanService.payInstallment).mockResolvedValue({ id: 'inst1', paid: true } as any);
    vi.mocked(loanService.getById).mockResolvedValue(updatedDetailedLoan as any);

    const { result } = renderHook(() => useLoans('p1'));

    await act(async () => {
      await result.current.payInstallment('inst1', '2026-07-01', 'l1');
    });

    expect(loanService.payInstallment).toHaveBeenCalledWith('inst1', '2026-07-01');
    expect(loanService.getById).toHaveBeenCalledWith('l1');
    expect(result.current.loans).toEqual([updatedDetailedLoan]);
  });
});
