import { useCallback, useEffect, useState } from 'react';
import { employeeService } from '../services/employeeService';
import {
  Employee,
  EmployeeScheduleRow,
  CalendarDayCell,
  EmployeeWeeklySchedule,
  AttendanceVerificationResponse,
} from '../types';

function daysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function normalizeDate(date: string): string {
  return date.split('T')[0];
}

function todayDateString(): string {
  const now = new Date();
  return formatDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

function fillMonth(totalDays: number, year: number, month: number, cell: (date: string) => CalendarDayCell): CalendarDayCell[] {
  const cells: CalendarDayCell[] = [];
  for (let day = 1; day <= totalDays; day++) {
    cells.push(cell(formatDate(year, month, day)));
  }
  return cells;
}

function buildRow(
  employee: Employee,
  schedule: EmployeeWeeklySchedule | null | undefined,
  attendance: AttendanceVerificationResponse,
  month: number,
  year: number,
  today: string
): EmployeeScheduleRow {
  const totalDays = daysInMonth(month, year);
  const lastDayOfMonth = formatDate(year, month, totalDays);
  const startDate = employee.start_date ? normalizeDate(employee.start_date) : null;
  const notYetHiredThisMonth = Boolean(startDate && startDate > lastDayOfMonth);

  if (!employee.active) {
    return {
      employee,
      hasSchedule: schedule !== null,
      days: fillMonth(totalDays, year, month, (date) => ({ date, state: 'NO_DATA', detail: 'Funcionário inativo' })),
      unjustifiedAbsenceCount: 0,
    };
  }

  if (!employee.user_id) {
    return {
      employee,
      hasSchedule: schedule !== null,
      days: fillMonth(totalDays, year, month, (date) => ({ date, state: 'NO_DATA', detail: 'Sem conta vinculada' })),
      unjustifiedAbsenceCount: 0,
    };
  }

  if (notYetHiredThisMonth) {
    return {
      employee,
      hasSchedule: schedule !== null,
      days: fillMonth(totalDays, year, month, (date) => ({ date, state: 'NOT_SCHEDULED', detail: 'Antes da contratação' })),
      unjustifiedAbsenceCount: 0,
    };
  }

  if (attendance.days.length === 0) {
    // Ambiguous case already resolved by the caller fetching `schedule` for us.
    if (schedule === null) {
      return {
        employee,
        hasSchedule: false,
        days: fillMonth(totalDays, year, month, (date) => ({ date, state: 'NO_DATA', detail: 'Sem escala definida' })),
        unjustifiedAbsenceCount: 0,
      };
    }
    return {
      employee,
      hasSchedule: true,
      days: fillMonth(totalDays, year, month, (date) => ({ date, state: 'NOT_SCHEDULED', detail: 'Folga' })),
      unjustifiedAbsenceCount: 0,
    };
  }

  const attendanceByDate = new Map(attendance.days.map((d) => [d.date, d.status]));

  const days = fillMonth(totalDays, year, month, (date) => {
    if (startDate && date < startDate) {
      return { date, state: 'NOT_SCHEDULED', detail: 'Antes da contratação' };
    }
    const status = attendanceByDate.get(date);
    if (!status) {
      return { date, state: 'NOT_SCHEDULED', detail: 'Folga' };
    }
    if (status === 'PRESENT') return { date, state: 'WORKED' };
    if (status === 'JUSTIFIED_ABSENCE') return { date, state: 'JUSTIFIED_ABSENCE' };
    // A day that hasn't happened yet (today, before it's over, or any future date) can never
    // be a confirmed absence — there simply isn't data for it yet, so it must not be flagged
    // as something requiring justification.
    if (date >= today) {
      return { date, state: 'NO_DATA', detail: 'Ainda não ocorreu' };
    }
    return { date, state: 'UNJUSTIFIED_ABSENCE' };
  });

  return {
    employee,
    hasSchedule: true,
    days,
    // Recomputed from the resolved `days` rather than trusting `attendance.unjustified_absence_count`
    // verbatim — the backend's count doesn't know about the today/future override above, so it
    // would otherwise disagree with what's actually shown as an unjustified absence.
    unjustifiedAbsenceCount: days.filter((d) => d.state === 'UNJUSTIFIED_ABSENCE').length,
  };
}

async function loadEmployeeRow(employee: Employee, month: number, year: number): Promise<EmployeeScheduleRow> {
  const attendance = await employeeService.getAttendanceVerification(employee.id, { month, year });

  const totalDays = daysInMonth(month, year);
  const lastDayOfMonth = formatDate(year, month, totalDays);
  const startDate = employee.start_date ? normalizeDate(employee.start_date) : null;
  const notYetHiredThisMonth = Boolean(startDate && startDate > lastDayOfMonth);

  const ambiguous =
    employee.active &&
    Boolean(employee.user_id) &&
    !notYetHiredThisMonth &&
    attendance.days.length === 0;

  const schedule = ambiguous ? await employeeService.getSchedule(employee.id) : undefined;

  return buildRow(employee, schedule, attendance, month, year, todayDateString());
}

export const useWorkSchedule = () => {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [rows, setRows] = useState<EmployeeScheduleRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const employees = await employeeService.getAll();
      const newRows = await Promise.all(
        employees.map((employee) => loadEmployeeRow(employee, month, year))
      );
      setRows(newRows);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    load();
  }, [load]);

  const refreshEmployeeRow = useCallback(async (employeeId: string) => {
    const row = rows.find((r) => r.employee.id === employeeId);
    if (!row) return;
    const updatedRow = await loadEmployeeRow(row.employee, month, year);
    setRows((current) => current.map((r) => (r.employee.id === employeeId ? updatedRow : r)));
  }, [rows, month, year]);

  // Both mutations below deliberately let errors propagate (rather than catching them here)
  // so the calling modal can surface the specific Error.message inline — see
  // contracts/use-work-schedule-hook.md. This hook's own `error` flag is reserved for the
  // initial load, not for these per-action mutations.
  const justifyAbsence = useCallback(async (employeeId: string, date: string, reason?: string): Promise<boolean> => {
    await employeeService.createJustifiedAbsence({
      employee_id: employeeId,
      absence_date: date,
      reason: reason ?? null,
    });
    await refreshEmployeeRow(employeeId);
    return true;
  }, [refreshEmployeeRow]);

  const removeJustification = useCallback(async (employeeId: string, date: string): Promise<boolean> => {
    const absences = await employeeService.listJustifiedAbsences({ employee_id: employeeId, month, year });
    const match = absences.find((a) => a.absence_date === date);
    if (!match) {
      throw new Error('Justificativa não encontrada. Atualize a página e tente novamente.');
    }
    await employeeService.deleteJustifiedAbsence(match.id);
    await refreshEmployeeRow(employeeId);
    return true;
  }, [refreshEmployeeRow, month, year]);

  return {
    rows,
    month,
    year,
    setMonth,
    setYear,
    loading,
    error,
    reload: load,
    justifyAbsence,
    removeJustification,
  };
};
