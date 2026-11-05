import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import AuditTab from './AuditTab';
import { useTirolesaAudit } from '../../hooks/useTirolesaAudit';
import { useTirolesaSetup } from '../../hooks/useTirolesaSetup';
import { TirolesaAuditDay } from '../../types';

type Audit = ReturnType<typeof useTirolesaAudit>;
type Setup = ReturnType<typeof useTirolesaSetup>;

const day: TirolesaAuditDay = {
  date: '2026-11-04',
  descents_detected: 3,
  descents_sold: 3,
  descents_below_default_price: 0,
  descents_justified: 0,
  unexplained: 0,
  sold_above_detected: 0,
  sales_amount: 150,
  estimated_unpaid_value: 0,
  status: 'BALANCED',
  device_hours: 8,
  clock_suspect_trips: 0,
  sensor_warning: false,
  justifications: [],
};

const audit = (): Audit => ({
  selectedDate: '2026-11-04',
  isToday: false,
  isYesterday: true,
  day,
  loading: false,
  error: null,
  goToPreviousDay: vi.fn(),
  goToNextDay: vi.fn(),
  goToYesterday: vi.fn(),
  reload: vi.fn(),
  addJustification: vi.fn(),
  removeJustification: vi.fn(),
});

const setup = (overrides: Partial<Setup> = {}): Setup => ({
  devices: [],
  links: [],
  products: [],
  loading: false,
  loaded: true,
  error: null,
  setupPending: false,
  hasActiveDevice: true,
  reload: vi.fn(),
  createDevice: vi.fn(),
  setDeviceActive: vi.fn(),
  linkProduct: vi.fn(),
  unlinkProduct: vi.fn(),
  ...overrides,
});

describe('AuditTab', () => {
  it('shows the verdict when everything loaded', () => {
    render(<AuditTab audit={audit()} setup={setup()} onOpenSetup={vi.fn()} />);

    expect(screen.getByText('Dia conferido')).toBeInTheDocument();
  });

  it('holds back the verdict when a setup reload failed', () => {
    const reload = vi.fn();
    render(<AuditTab audit={audit()} setup={setup({ error: 'falhou', reload })} onOpenSetup={vi.fn()} />);

    expect(screen.queryByText('Dia conferido')).not.toBeInTheDocument();
    expect(screen.getByText('falhou')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(reload).toHaveBeenCalled();
  });
});
