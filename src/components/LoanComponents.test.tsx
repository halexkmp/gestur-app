import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import InstallmentList from './InstallmentList';
import LoanFormModal from './LoanFormModal';
import LoanDrawer from './LoanDrawer';
import { useLoans } from '../hooks/useLoans';

// Mock hook
vi.mock('../hooks/useLoans', () => ({
  useLoans: vi.fn(),
}));

describe('InstallmentList Component', () => {
  const mockOnPay = vi.fn();
  const mockInstallments = [
    {
      id: 'inst2',
      loan_id: 'l1',
      installment_number: 2,
      amount: 150,
      due_date: '2026-08-10',
      payment_date: null,
      paid: false,
      created_at: '',
      updated_at: '',
    },
    {
      id: 'inst1',
      loan_id: 'l1',
      installment_number: 1,
      amount: 150,
      due_date: '2026-07-10',
      payment_date: '2026-07-09',
      paid: true,
      created_at: '',
      updated_at: '',
    },
  ];

  beforeEach(() => {
    mockOnPay.mockClear();
  });

  it('renders installments in chronological order by installment_number', () => {
    render(<InstallmentList installments={mockInstallments} onPay={mockOnPay} />);

    const rows = screen.getAllByRole('row');
    // Row 0 is header, Row 1 should be inst1 (installment_number: 1), Row 2 should be inst2 (installment_number: 2)
    expect(rows[1]).toHaveTextContent('1');
    expect(rows[1]).toHaveTextContent('Pago');
    expect(rows[2]).toHaveTextContent('2');
    expect(rows[2]).toHaveTextContent('Marcar Pago');
  });

  it('shows inline confirmation and triggers onPay when confirmed', async () => {
    render(<InstallmentList installments={mockInstallments} onPay={mockOnPay} />);

    const payBtn = screen.getByText('Marcar Pago');
    fireEvent.click(payBtn);

    expect(screen.getByText('Confirmar?')).toBeInTheDocument();
    const yesBtn = screen.getByText('Sim');
    fireEvent.click(yesBtn);

    await waitFor(() => {
      expect(mockOnPay).toHaveBeenCalledWith('inst2');
    });
  });
});

describe('LoanFormModal Component', () => {
  const mockOnSubmit = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
    mockOnClose.mockClear();
  });

  it('shows validation errors for invalid inputs', async () => {
    render(<LoanFormModal partnerId="p1" onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    const submitBtn = screen.getByText('Salvar Empréstimo');
    fireEvent.click(submitBtn);

    expect(screen.getByText('O valor principal é obrigatório.')).toBeInTheDocument();
  });

  it('submits correctly for valid inputs', async () => {
    render(<LoanFormModal partnerId="p1" onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    // Fill principal
    const principalInput = screen.getByPlaceholderText('0,00');
    fireEvent.change(principalInput, { target: { value: '1500' } });

    // Fill dates
    const startInput = screen.getAllByLabelText(/Data/i)[0]; // Start Date
    const endInput = screen.getAllByLabelText(/Data/i)[1]; // End Date
    fireEvent.change(startInput, { target: { value: '2026-07-01' } });
    fireEvent.change(endInput, { target: { value: '2026-12-01' } });

    const submitBtn = screen.getByText('Salvar Empréstimo');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        partner_id: 'p1',
        principal_amount: 1500,
        interest_rate: 0,
        installments: 1,
        due_day: 10,
        start_date: '2026-07-01',
        end_date: '2026-12-01',
      });
    });
  });
});

describe('LoanDrawer Component', () => {
  const mockPartner = {
    id: 'p1',
    name: 'Buggyman Test',
    pix_key: 'test-pix',
    type: 'BUGGYMAN' as any,
    active: true,
    created_at: '',
  };
  const mockOnClose = vi.fn();
  const mockFetchLoanDetails = vi.fn();
  const mockCreateLoan = vi.fn();
  const mockPayInstallment = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockFetchLoanDetails.mockClear();
    mockCreateLoan.mockClear();
    mockPayInstallment.mockClear();

    vi.mocked(useLoans).mockReturnValue({
      loans: [
        {
          id: 'l1',
          partner_id: 'p1',
          principal_amount: 1000,
          interest_rate: 10,
          total_amount: 1100,
          installments: 2,
          due_day: 10,
          start_date: '2026-07-01',
          end_date: '2026-09-01',
          status: 'ACTIVE',
          created_at: '',
          updated_at: '',
        },
      ],
      loading: false,
      error: null,
      fetchLoans: vi.fn(),
      fetchLoanDetails: mockFetchLoanDetails,
      createLoan: mockCreateLoan,
      payInstallment: mockPayInstallment,
    });
  });

  it('renders and allows collapsing/expanding loan details', async () => {
    render(<LoanDrawer isOpen={true} onClose={mockOnClose} partner={mockPartner} />);

    expect(screen.getByText('Buggyman Test')).toBeInTheDocument();
    expect(screen.getByText('R$ 1.000,00')).toBeInTheDocument();

    const cardHeader = screen.getByText('Principal').parentElement?.parentElement;
    if (cardHeader) fireEvent.click(cardHeader);

    expect(mockFetchLoanDetails).toHaveBeenCalledWith('l1');
  });
});
