import { useCallback, useEffect, useState } from 'react';
import { employeeService } from '../services/employeeService';
import { SalaryAdvance, SalarySummaryResponse } from '../types';

const now = new Date();

export const useEmployeeSalarySummary = () => {
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [year, setYear] = useState<number>(now.getFullYear());
  const [summary, setSummary] = useState<SalarySummaryResponse | null>(null);
  const [advances, setAdvances] = useState<SalaryAdvance[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [unavailable, setUnavailable] = useState<boolean>(false);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setUnavailable(false);
    try {
      const [summaryData, advancesData] = await Promise.all([
        employeeService.getMySalarySummary({ month, year }),
        employeeService.getMySalaryAdvances({ month, year }),
      ]);
      setSummary(summaryData);
      setAdvances(advancesData);
    } catch {
      // Self-service access may not be live yet on the backend (see
      // contracts/employee-self-service-salary.md) — degrade gracefully rather
      // than breaking the check-in screen.
      setSummary(null);
      setAdvances([]);
      setUnavailable(true);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summary, advances, month, year, setMonth, setYear, loading, unavailable };
};
