import { useCallback, useEffect, useState } from 'react';
import { employeeService } from '../services/employeeService';
import { CreateSalaryAdvanceRequest, EmployeePaycheck, SalarySummaryOverviewItem } from '../types';

const now = new Date();

export const useEmployeePaychecks = () => {
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [year, setYear] = useState<number>(now.getFullYear());
  const [paychecks, setPaychecks] = useState<EmployeePaycheck[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);

  // Bulk-loads every active employee's salary summary (and embedded advances) for the
  // selected month/year in one call, replacing what used to be a per-employee lazy fetch on
  // row expand. The overview response includes inactive employees too, but the lookup below
  // only matches against employees that already survived the active filter.
  const fetchPaychecks = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [employees, overview] = await Promise.all([
        employeeService.getAll(),
        employeeService.getSalarySummaryOverview({ month, year }),
      ]);
      const summaryByEmployeeId = new Map<string, SalarySummaryOverviewItem>(
        overview.items.map(item => [item.employee_id, item])
      );
      const activeEmployees = employees.filter(e => e.active);
      setPaychecks(activeEmployees.map(employee => {
        const summary = summaryByEmployeeId.get(employee.id);
        return {
          employee_id: employee.id,
          employee_name: employee.name,
          base_salary: employee.salary,
          ...(summary ? {
            month: summary.month,
            year: summary.year,
            gross_salary: summary.gross_salary,
            advances_total: summary.advances_total,
            late_delay_minutes: summary.late_delay_minutes,
            late_days_count: summary.late_days_count,
            late_deduction_total: summary.late_deduction_total,
            net_salary: summary.net_salary,
            advances: summary.advances,
          } : {}),
        };
      }));
    } catch {
      setPaychecks([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchPaychecks();
  }, [fetchPaychecks]);

  const createAdvance = useCallback(async (payload: CreateSalaryAdvanceRequest) => {
    await employeeService.createSalaryAdvance(payload);
    await fetchPaychecks();
  }, [fetchPaychecks]);

  const deleteAdvance = useCallback(async (advanceId: string) => {
    await employeeService.deleteSalaryAdvance(advanceId);
    await fetchPaychecks();
  }, [fetchPaychecks]);

  return {
    paychecks,
    month,
    year,
    setMonth,
    setYear,
    loading,
    error,
    fetchPaychecks,
    createAdvance,
    deleteAdvance,
  };
};
