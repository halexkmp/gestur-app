import { api } from '../lib/api';
import { Loan, LoanInstallment, CreateLoanRequest, UpdateLoanRequest, LoanInstallmentPayment } from '../types';

export const loanService = {
  getByPartner: (partnerId: string): Promise<Loan[]> => {
    return api.get<Loan[]>('/loans', { params: { partner_id: partnerId } });
  },

  getById: (loanId: string): Promise<Loan> => {
    return api.get<Loan>(`/loans/${loanId}`);
  },

  create: (data: CreateLoanRequest): Promise<Loan> => {
    return api.post<Loan>('/loans', data);
  },

  update: (loanId: string, data: UpdateLoanRequest): Promise<Loan> => {
    return api.put<Loan>(`/loans/${loanId}`, data);
  },

  payInstallment: (installmentId: string, paymentDate: string): Promise<LoanInstallment> => {
    return api.patch<LoanInstallment>(`/loan-installments/${installmentId}/pay`, {
      payment_date: paymentDate,
    });
  },

  getInstallmentPayments: (installmentId: string): Promise<LoanInstallmentPayment[]> => {
    return api.get<LoanInstallmentPayment[]>(`/loan-installments/${installmentId}/payments`);
  },

  createInstallmentPayment: (
    installmentId: string,
    data: { amount: number; payment_date: string; notes?: string }
  ): Promise<LoanInstallmentPayment> => {
    return api.post<LoanInstallmentPayment>(`/loan-installments/${installmentId}/payments`, data);
  },
};
