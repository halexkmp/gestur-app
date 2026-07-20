import { useCallback, useEffect, useState } from 'react';
import { employeeService } from '../services/employeeService';
import { CreateSalaryAdvanceRequest, EmployeePaycheck, SalaryAdvance } from '../types';

const now = new Date();

export const useEmployeePaychecks = () => {
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [year, setYear] = useState<number>(now.getFullYear());
  const [paychecks, setPaychecks] = useState<EmployeePaycheck[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [advancesByEmployee, setAdvancesByEmployee] = useState<Record<string, SalaryAdvance[]>>({});

  const fetchPaychecks = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const employees = await employeeService.getAll();
      const activeEmployees = employees.filter(e => e.active);
      const summaries = await Promise.all(
        activeEmployees.map(e => employeeService.getSalarySummary(e.id, { month, year }))
      );
      const composed: EmployeePaycheck[] = activeEmployees.map((employee, index) => {
        const summary = summaries[index];
        return {
          employee_id: employee.id,
          employee_name: employee.name,
          month: summary.month,
          year: summary.year,
          gross_salary: summary.gross_salary,
          advances_total: summary.advances_total,
          late_delay_minutes: summary.late_delay_minutes,
          late_days_count: summary.late_days_count,
          late_deduction_total: summary.late_deduction_total,
          net_salary: summary.net_salary,
        };
      });
      setPaychecks(composed);
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

  const getAdvancesForEmployee = useCallback(
    (employeeId: string): SalaryAdvance[] | undefined => advancesByEmployee[employeeId],
    [advancesByEmployee]
  );

  const loadAdvancesForEmployee = useCallback(async (employeeId: string) => {
    try {
      const advances = await employeeService.listSalaryAdvances({ employee_id: employeeId, month, year });
      setAdvancesByEmployee(prev => ({ ...prev, [employeeId]: advances }));
    } catch {
      setAdvancesByEmployee(prev => ({ ...prev, [employeeId]: [] }));
    }
  }, [month, year]);

  const refreshEmployee = useCallback(async (employeeId: string) => {
    try {
      const summary = await employeeService.getSalarySummary(employeeId, { month, year });
      setPaychecks(prev => prev.map(p => (
        p.employee_id === employeeId
          ? {
            ...p,
            gross_salary: summary.gross_salary,
            advances_total: summary.advances_total,
            late_delay_minutes: summary.late_delay_minutes,
            late_days_count: summary.late_days_count,
            late_deduction_total: summary.late_deduction_total,
            net_salary: summary.net_salary,
          }
          : p
      )));
    } catch {
      // Leave existing figures in place rather than clearing them on a transient failure.
    }
  }, [month, year]);

  const createAdvance = useCallback(async (payload: CreateSalaryAdvanceRequest) => {
    await employeeService.createSalaryAdvance(payload);
    await Promise.all([
      refreshEmployee(payload.employee_id),
      loadAdvancesForEmployee(payload.employee_id),
    ]);
  }, [refreshEmployee, loadAdvancesForEmployee]);

  const deleteAdvance = useCallback(async (advanceId: string, employeeId: string) => {
    await employeeService.deleteSalaryAdvance(advanceId);
    await Promise.all([
      refreshEmployee(employeeId),
      loadAdvancesForEmployee(employeeId),
    ]);
  }, [refreshEmployee, loadAdvancesForEmployee]);

  return {
    paychecks,
    month,
    year,
    setMonth,
    setYear,
    loading,
    error,
    fetchPaychecks,
    getAdvancesForEmployee,
    loadAdvancesForEmployee,
    createAdvance,
    deleteAdvance,
  };
};
