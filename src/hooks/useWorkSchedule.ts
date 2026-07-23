import { useCallback, useEffect, useState } from 'react';
import { employeeService } from '../services/employeeService';
import {
  Employee,
  EmployeeScheduleRow,
  CalendarDayCell,
  AttendanceDay,
  ScheduleOverviewItem,
  WeeklySchedulePattern,
} from '../types';

interface AttendanceData {
  days: AttendanceDay[];
  unjustified_absence_count: number;
  weeklyPattern: WeeklySchedulePattern;
}

const WEEKDAY_KEYS: (keyof WeeklySchedulePattern)[] = [
  'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
];

function toWeeklyPattern(item: ScheduleOverviewItem): WeeklySchedulePattern {
  const { monday, tuesday, wednesday, thursday, friday, saturday, sunday } = item;
  return { monday, tuesday, wednesday, thursday, friday, saturday, sunday };
}

function isScheduledDay(pattern: WeeklySchedulePattern, date: string): boolean {
  const jsDay = new Date(`${date}T12:00:00`).getDay();
  return pattern[WEEKDAY_KEYS[jsDay]];
}

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

// `attendance` is undefined when the employee has no Employee Weekly Schedule at all — the
// bulk schedule-overview endpoint simply omits such employees from its `items` array, which is
// itself the "no schedule" signal (no separate lookup needed to disambiguate this, unlike the
// old per-employee-endpoint approach — see specs/005-hr-schedule-tab/research.md).
function buildRow(
  employee: Employee,
  attendance: AttendanceData | undefined,
  month: number,
  year: number,
  today: string
): EmployeeScheduleRow {
  const totalDays = daysInMonth(month, year);
  const lastDayOfMonth = formatDate(year, month, totalDays);
  const startDate = employee.start_date ? normalizeDate(employee.start_date) : null;
  const notYetHiredThisMonth = Boolean(startDate && startDate > lastDayOfMonth);
  const weeklyPattern = attendance?.weeklyPattern ?? null;

  if (!employee.active) {
    return {
      employee,
      hasSchedule: Boolean(attendance),
      weeklyPattern,
      days: fillMonth(totalDays, year, month, (date) => ({ date, state: 'NO_DATA', detail: 'Funcionário inativo' })),
      unjustifiedAbsenceCount: 0,
    };
  }

  if (!employee.user_id) {
    return {
      employee,
      hasSchedule: Boolean(attendance),
      weeklyPattern,
      days: fillMonth(totalDays, year, month, (date) => ({ date, state: 'NO_DATA', detail: 'Sem conta vinculada' })),
      unjustifiedAbsenceCount: 0,
    };
  }

  if (notYetHiredThisMonth) {
    return {
      employee,
      hasSchedule: Boolean(attendance),
      weeklyPattern,
      days: fillMonth(totalDays, year, month, (date) => ({ date, state: 'NOT_SCHEDULED', detail: 'Antes da contratação' })),
      unjustifiedAbsenceCount: 0,
    };
  }

  if (!attendance) {
    return {
      employee,
      hasSchedule: false,
      weeklyPattern: null,
      days: fillMonth(totalDays, year, month, (date) => ({ date, state: 'NO_DATA', detail: 'Sem escala definida' })),
      unjustifiedAbsenceCount: 0,
    };
  }

  const attendanceByDate = new Map(attendance.days.map((d) => [d.date, d.status]));

  const days = fillMonth(totalDays, year, month, (date) => {
    if (startDate && date < startDate) {
      return { date, state: 'NOT_SCHEDULED', detail: 'Antes da contratação' };
    }
    const status = attendanceByDate.get(date);
    // An explicit status from the backend always wins over the weekly pattern below — the
    // contract guarantees a date only appears in `days` when it's a real scheduled work day.
    if (status === 'PRESENT') return { date, state: 'WORKED' };
    if (status === 'JUSTIFIED_ABSENCE') return { date, state: 'JUSTIFIED_ABSENCE' };
    if (status === 'UNJUSTIFIED_ABSENCE') {
      // A day that hasn't happened yet (today, before it's over, or any future date) can never
      // be a confirmed absence — there simply isn't data for it yet, so it must not be flagged
      // as something requiring justification.
      if (date >= today) {
        return { date, state: 'NO_DATA', detail: 'Ainda não ocorreu' };
      }
      return { date, state: 'UNJUSTIFIED_ABSENCE' };
    }
    // No status at all: the backend only reports a status for days that have already occurred,
    // so a future work day is *also* absent from `days` here — the weekly pattern is what
    // disambiguates a real day off (Folga) from a work day that simply hasn't happened yet.
    if (!isScheduledDay(attendance.weeklyPattern, date)) {
      return { date, state: 'NOT_SCHEDULED', detail: 'Folga' };
    }
    return { date, state: 'NO_DATA', detail: 'Ainda não ocorreu' };
  });

  return {
    employee,
    hasSchedule: true,
    weeklyPattern,
    days,
    // Recomputed from the resolved `days` rather than trusting the backend's count verbatim —
    // the backend doesn't know about the today/future override above, so it would otherwise
    // disagree with what's actually shown as an unjustified absence.
    unjustifiedAbsenceCount: days.filter((d) => d.state === 'UNJUSTIFIED_ABSENCE').length,
  };
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
      // Two requests total, regardless of headcount: the employee list, then one bulk call
      // covering every employee's schedule + attendance for the month. Replaces what used to
      // be up to 3 requests per employee (see specs/005-hr-schedule-tab/research.md).
      const [employees, overview] = await Promise.all([
        employeeService.getAll(),
        employeeService.getScheduleOverview({ month, year }),
      ]);
      const attendanceByEmployeeId = new Map<string, AttendanceData>(
        overview.items.map((item) => [
          item.employee_id,
          { days: item.days, unjustified_absence_count: item.unjustified_absence_count, weeklyPattern: toWeeklyPattern(item) },
        ])
      );
      const todayStr = todayDateString();
      const newRows = employees.map((employee) =>
        buildRow(employee, attendanceByEmployeeId.get(employee.id), month, year, todayStr)
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

  // Refreshing a single row after a justify/remove mutation only needs that one employee's
  // attendance (their schedule can't have changed from these actions), so this deliberately
  // uses the single-employee endpoint rather than re-fetching the bulk overview for everyone.
  const refreshEmployeeRow = useCallback(async (employeeId: string) => {
    const row = rows.find((r) => r.employee.id === employeeId);
    if (!row) return;
    const attendance: AttendanceData | undefined = row.weeklyPattern
      ? {
          ...(await employeeService.getAttendanceVerification(employeeId, { month, year })),
          weeklyPattern: row.weeklyPattern,
        }
      : undefined;
    const updatedRow = buildRow(row.employee, attendance, month, year, todayDateString());
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
