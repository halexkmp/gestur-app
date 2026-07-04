import { render, screen, fireEvent } from '@testing-library/react';
import LoanFormModal from './LoanFormModal';
import { vi, describe, it, expect } from 'vitest';

describe('LoanFormModal - Dynamic Preview', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  it('renders correctly and shows default preview states', () => {
    render(
      <LoanFormModal
        partnerId="partner-123"
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    // Header check
    expect(screen.getByText('Novo Empréstimo')).toBeInTheDocument();

    // Default states
    const previewEndDate = screen.getByTestId('preview-end-date');
    const previewTotalAmount = screen.getByTestId('preview-total-amount');

    expect(previewTotalAmount).toHaveTextContent('-');
    
    // Default installments qty is '1'. Start date defaults to today.
    // Let's verify end date is calculated as today + 7 days
    const today = new Date();
    const expectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    expectedDate.setDate(expectedDate.getDate() + 7);
    const expectedFormattedDate = `${String(expectedDate.getDate()).padStart(2, '0')}/${String(expectedDate.getMonth() + 1).padStart(2, '0')}/${expectedDate.getFullYear()}`;

    expect(previewEndDate).toHaveTextContent(expectedFormattedDate);
  });

  it('updates estimated end date and total amount dynamically when inputs change', () => {
    render(
      <LoanFormModal
        partnerId="partner-123"
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const principalInput = screen.getByPlaceholderText('0,00');
    const rateInput = screen.getByText('Taxa de Juros (%)').parentElement?.querySelector('input') as HTMLInputElement;
    const installmentsInput = screen.getByText('Nº de Parcelas').parentElement?.querySelector('input') as HTMLInputElement;
    const startDateInput = screen.getByText('Data de Início').parentElement?.querySelector('input') as HTMLInputElement;

    // Set Principal = 1000
    fireEvent.change(principalInput, { target: { value: '1000' } });
    // Set Rate = 10
    fireEvent.change(rateInput, { target: { value: '10' } });
    // Set Installments = 5
    fireEvent.change(installmentsInput, { target: { value: '5' } });
    // Set Start Date = 2026-07-01
    fireEvent.change(startDateInput, { target: { value: '2026-07-01' } });

    // Verify calculated details:
    // Total Amount = 1000 * (1 + (10 / 100) * 5) = 1000 * 1.5 = 1500
    // Formatted in BRL: R$ 1.500,00
    const previewTotalAmount = screen.getByTestId('preview-total-amount');
    // Using loose match because character spaces (e.g. non-breaking space) can vary in pt-BR locale
    expect(previewTotalAmount.textContent?.replace(/\u00a0/g, ' ')).toMatch(/R\$\s*1\.500,00/);

    // End Date = 2026-07-01 + 5 weeks (35 days) = 2026-08-05 (YYYY-MM-DD to DD/MM/YYYY)
    // 2026-07-01 + 35 days:
    // July has 31 days. So 2026-07-01 + 30 days is 2026-07-31.
    // + 5 days is 2026-08-05.
    const previewEndDate = screen.getByTestId('preview-end-date');
    expect(previewEndDate).toHaveTextContent('05/08/2026');
  });

  it('degrades preview gracefully when input values are invalid or empty', () => {
    render(
      <LoanFormModal
        partnerId="partner-123"
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const principalInput = screen.getByPlaceholderText('0,00');
    const previewTotalAmount = screen.getByTestId('preview-total-amount');

    // Principal empty
    fireEvent.change(principalInput, { target: { value: '' } });
    expect(previewTotalAmount).toHaveTextContent('-');

    // Principal <= 0
    fireEvent.change(principalInput, { target: { value: '-500' } });
    expect(previewTotalAmount).toHaveTextContent('-');
  });
});
