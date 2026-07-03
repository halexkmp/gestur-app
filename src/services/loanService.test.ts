import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loanService } from './loanService';
import { api } from '../lib/api';

vi.mock('../lib/api', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('loanService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call api.get with params for getByPartner', async () => {
    const response = [{ id: '1', partner_id: 'p1', principal_amount: 1000 }];
    vi.mocked(api.get).mockResolvedValue(response);

    const result = await loanService.getByPartner('p1');

    expect(api.get).toHaveBeenCalledWith('/loans', { params: { partner_id: 'p1' } });
    expect(result).toEqual(response);
  });

  it('should call api.get with id for getById', async () => {
    const response = { id: 'l1', partner_id: 'p1', principal_amount: 1000 };
    vi.mocked(api.get).mockResolvedValue(response);

    const result = await loanService.getById('l1');

    expect(api.get).toHaveBeenCalledWith('/loans/l1');
    expect(result).toEqual(response);
  });

  it('should call api.post for create', async () => {
    const payload = {
      partner_id: 'p1',
      principal_amount: 1000,
      interest_rate: 10,
      installments: 5,
      due_day: 10,
      start_date: '2026-07-01',
      end_date: '2026-12-01',
    };
    const response = { id: 'l1', ...payload };
    vi.mocked(api.post).mockResolvedValue(response);

    const result = await loanService.create(payload);

    expect(api.post).toHaveBeenCalledWith('/loans', payload);
    expect(result).toEqual(response);
  });

  it('should call api.patch for payInstallment', async () => {
    const response = { id: 'inst1', paid: true, payment_date: '2026-08-10' };
    vi.mocked(api.patch).mockResolvedValue(response);

    const result = await loanService.payInstallment('inst1', '2026-08-10');

    expect(api.patch).toHaveBeenCalledWith('/loan-installments/inst1/pay', {
      payment_date: '2026-08-10',
    });
    expect(result).toEqual(response);
  });
});
