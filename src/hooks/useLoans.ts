import { useState, useCallback, useEffect } from 'react';
import { loanService } from '../services/loanService';
import { Loan, CreateLoanRequest, LoanInstallment } from '../types';

export const useLoans = (partnerId?: string) => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLoans = useCallback(async () => {
    if (!partnerId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await loanService.getByPartner(partnerId);
      setLoans(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch loans');
    } finally {
      setLoading(false);
    }
  }, [partnerId]);

  const fetchLoanDetails = useCallback(async (loanId: string): Promise<Loan> => {
    setLoading(true);
    setError(null);
    try {
      const detailedLoan = await loanService.getById(loanId);
      setLoans(prev => prev.map(loan => loan.id === loanId ? detailedLoan : loan));
      return detailedLoan;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch loan details');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createLoan = useCallback(async (data: CreateLoanRequest): Promise<Loan> => {
    setLoading(true);
    setError(null);
    try {
      const newLoan = await loanService.create(data);
      await fetchLoans();
      return newLoan;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create loan');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchLoans]);

  const payInstallment = useCallback(async (
    installmentId: string,
    paymentDate: string,
    loanId?: string
  ): Promise<LoanInstallment> => {
    setLoading(true);
    setError(null);
    try {
      const updatedInstallment = await loanService.payInstallment(installmentId, paymentDate);
      if (loanId) {
        await fetchLoanDetails(loanId);
      } else {
        await fetchLoans();
      }
      return updatedInstallment;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register installment payment');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchLoans, fetchLoanDetails]);

  useEffect(() => {
    if (partnerId) {
      fetchLoans();
    } else {
      setLoans([]);
    }
  }, [partnerId, fetchLoans]);

  return {
    loans,
    loading,
    error,
    fetchLoans,
    fetchLoanDetails,
    createLoan,
    payInstallment,
  };
};
