import { useCallback, useState } from 'react';
import { employeeService } from '../services/employeeService';
import { EmployeeWeeklySchedule } from '../types';

export type WeeklyScheduleDays = Omit<EmployeeWeeklySchedule, 'employee_id'>;

export const useEmployeeSchedule = (employeeId: string | null) => {
  const [schedule, setSchedule] = useState<EmployeeWeeklySchedule | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!employeeId) {
      setSchedule(null);
      setIsConfigured(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await employeeService.getSchedule(employeeId);
      setSchedule(data);
      setIsConfigured(data !== null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch employee schedule');
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  const save = useCallback(async (days: WeeklyScheduleDays): Promise<boolean> => {
    if (!employeeId) {
      setError('Cannot save a schedule before the employee has been created.');
      return false;
    }

    setLoading(true);
    setError(null);
    try {
      const updated = await employeeService.updateSchedule(employeeId, days);
      setSchedule(updated);
      setIsConfigured(true);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save employee schedule');
      return false;
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  return { schedule, isConfigured, loading, error, load, save };
};
