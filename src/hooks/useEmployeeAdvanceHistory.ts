import { useCallback, useEffect, useState } from 'react';
import { employeeService } from '../services/employeeService';
import { SalaryAdvance } from '../types';

const sortByDateDescending = (advances: SalaryAdvance[]): SalaryAdvance[] =>
  [...advances].sort((a, b) => {
    if (!a.advance_date) return 1;
    if (!b.advance_date) return -1;
    return b.advance_date.localeCompare(a.advance_date);
  });

export const useEmployeeAdvanceHistory = (employeeId: string) => {
  const [advances, setAdvances] = useState<SalaryAdvance[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await employeeService.listSalaryAdvances(employeeId);
      const sorted = sortByDateDescending(data);
      setAdvances(sorted);
      setTotal(sorted.reduce((sum, advance) => sum + Number(advance.amount), 0));
    } catch {
      setAdvances([]);
      setTotal(0);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { advances, total, loading, error, reload };
};
