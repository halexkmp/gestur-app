import { renderHook, act, waitFor } from '@testing-library/react';
import { useWorkSchedule } from './useWorkSchedule';
import { employeeService } from '../services/employeeService';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Employee, AttendanceVerificationResponse, ScheduleOverviewItem, ScheduleOverviewResponse } from '../types';

vi.mock('../services/employeeService');

// Deliberately not faking the system clock (fake timers deadlock @testing-library's
// waitFor). Instead, dates are derived from the real "now" so they always line up with
// whatever default month/year the hook itself picks.
const now = new Date();
const year = now.getFullYear();
const month = now.getMonth() + 1;
const pad = (n: number) => String(n).padStart(2, '0');
const dateStr = (day: number) => `${year}-${pad(month)}-${pad(day)}`;
const WEEKDAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
const weekdayKeyFor = (day: number) => WEEKDAY_KEYS[new Date(year, month - 1, day).getDay()];

const activeLinkedEmployee: Employee = {
  id: 'e1',
  name: 'Alice',
  salary: 1000,
  active: true,
  start_date: '2020-01-01',
  user_id: 'u1',
};

function overviewItem(overrides: Partial<ScheduleOverviewItem> = {}): ScheduleOverviewItem {
  return {
    employee_id: 'e1',
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
    month,
    year,
    days: [],
    unjustified_absence_count: 0,
    ...overrides,
  };
}

function overview(items: ScheduleOverviewItem[] = []): ScheduleOverviewResponse {
  return { items };
}

function attendance(overrides: Partial<AttendanceVerificationResponse> = {}): AttendanceVerificationResponse {
  return {
    employee_id: 'e1',
    month,
    year,
    days: [],
    unjustified_absence_count: 0,
    ...overrides,
  };
}

describe('useWorkSchedule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('marks inactive employees as NO_DATA for the whole month without any per-employee calls', async () => {
    vi.mocked(employeeService.getAll).mockResolvedValue([{ ...activeLinkedEmployee, active: false }]);
    vi.mocked(employeeService.getScheduleOverview).mockResolvedValue(overview());

    const { result } = renderHook(() => useWorkSchedule());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.rows[0].days.every((d) => d.state === 'NO_DATA' && d.detail === 'Funcionário inativo')).toBe(true);
    expect(employeeService.getSchedule).not.toHaveBeenCalled();
    expect(employeeService.getAttendanceVerification).not.toHaveBeenCalled();
  });

  it('marks employees with no linked account as NO_DATA without any per-employee calls', async () => {
    vi.mocked(employeeService.getAll).mockResolvedValue([{ ...activeLinkedEmployee, user_id: null }]);
    vi.mocked(employeeService.getScheduleOverview).mockResolvedValue(overview());

    const { result } = renderHook(() => useWorkSchedule());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.rows[0].days.every((d) => d.state === 'NO_DATA' && d.detail === 'Sem conta vinculada')).toBe(true);
    expect(employeeService.getAttendanceVerification).not.toHaveBeenCalled();
  });

  it('treats a not-yet-hired employee as NOT_SCHEDULED', async () => {
    vi.mocked(employeeService.getAll).mockResolvedValue([{ ...activeLinkedEmployee, start_date: `${year + 5}-01-01` }]);
    vi.mocked(employeeService.getScheduleOverview).mockResolvedValue(overview());

    const { result } = renderHook(() => useWorkSchedule());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.rows[0].days.every((d) => d.state === 'NOT_SCHEDULED' && d.detail === 'Antes da contratação')).toBe(true);
  });

  it('resolves to NO_DATA/"Sem escala definida" when the employee is absent from the overview items', async () => {
    vi.mocked(employeeService.getAll).mockResolvedValue([activeLinkedEmployee]);
    vi.mocked(employeeService.getScheduleOverview).mockResolvedValue(overview([]));

    const { result } = renderHook(() => useWorkSchedule());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.rows[0].hasSchedule).toBe(false);
    expect(result.current.rows[0].days.every((d) => d.state === 'NO_DATA' && d.detail === 'Sem escala definida')).toBe(true);
  });

  it('resolves to NOT_SCHEDULED/Folga for every day when the schedule has zero work days', async () => {
    vi.mocked(employeeService.getAll).mockResolvedValue([activeLinkedEmployee]);
    vi.mocked(employeeService.getScheduleOverview).mockResolvedValue(
      overview([
        overviewItem({
          monday: false, tuesday: false, wednesday: false, thursday: false,
          friday: false, saturday: false, sunday: false,
          days: [],
        }),
      ])
    );

    const { result } = renderHook(() => useWorkSchedule());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.rows[0].hasSchedule).toBe(true);
    expect(result.current.rows[0].days.every((d) => d.state === 'NOT_SCHEDULED' && d.detail === 'Folga')).toBe(true);
  });

  it('treats an unlisted work day as NO_DATA rather than Folga — it simply has not happened yet', async () => {
    vi.mocked(employeeService.getAll).mockResolvedValue([activeLinkedEmployee]);
    const totalDays = new Date(year, month, 0).getDate();
    const lastDayOfMonth = dateStr(totalDays);
    vi.mocked(employeeService.getScheduleOverview).mockResolvedValue(
      overview([
        overviewItem({
          monday: true, tuesday: true, wednesday: true, thursday: true,
          friday: true, saturday: true, sunday: true,
          days: [],
        }),
      ])
    );

    const { result } = renderHook(() => useWorkSchedule());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Every weekday is a work day per the pattern, so the last day of the month (always today
    // or later) being absent from `days` means it hasn't happened yet — not a day off.
    const cell = result.current.rows[0].days.find((d) => d.date === lastDayOfMonth);
    expect(cell?.state).toBe('NO_DATA');
    expect(cell?.detail).toBe('Ainda não ocorreu');
  });

  it('the initial load fetches only the employee list and the bulk overview, never per-employee endpoints', async () => {
    vi.mocked(employeeService.getAll).mockResolvedValue([activeLinkedEmployee]);
    vi.mocked(employeeService.getScheduleOverview).mockResolvedValue(
      overview([overviewItem({ days: [{ date: dateStr(1), status: 'PRESENT' }] })])
    );

    const { result } = renderHook(() => useWorkSchedule());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(employeeService.getScheduleOverview).toHaveBeenCalledTimes(1);
    expect(employeeService.getScheduleOverview).toHaveBeenCalledWith({ month, year });
    expect(employeeService.getSchedule).not.toHaveBeenCalled();
    expect(employeeService.getAttendanceVerification).not.toHaveBeenCalled();
    expect(result.current.rows[0].days.find((d) => d.date === dateStr(1))?.state).toBe('WORKED');
  });

  it('treats today as NO_DATA rather than an unjustified absence when nothing has happened yet', async () => {
    const todayStr = dateStr(now.getDate());
    vi.mocked(employeeService.getAll).mockResolvedValue([activeLinkedEmployee]);
    vi.mocked(employeeService.getScheduleOverview).mockResolvedValue(
      overview([overviewItem({ days: [{ date: todayStr, status: 'UNJUSTIFIED_ABSENCE' }], unjustified_absence_count: 1 })])
    );

    const { result } = renderHook(() => useWorkSchedule());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const todayCell = result.current.rows[0].days.find((d) => d.date === todayStr);
    expect(todayCell?.state).toBe('NO_DATA');
    expect(todayCell?.detail).toBe('Ainda não ocorreu');
    // The count is recomputed from the resolved days, not the raw backend field, so it must
    // not count today's suppressed cell as an unjustified absence.
    expect(result.current.rows[0].unjustifiedAbsenceCount).toBe(0);
  });

  it('maps PRESENT/JUSTIFIED_ABSENCE/UNJUSTIFIED_ABSENCE and defaults an unlisted rest day to NOT_SCHEDULED/Folga', async () => {
    vi.mocked(employeeService.getAll).mockResolvedValue([activeLinkedEmployee]);
    vi.mocked(employeeService.getScheduleOverview).mockResolvedValue(
      overview([
        overviewItem({
          monday: true, tuesday: true, wednesday: true, thursday: true,
          friday: true, saturday: true, sunday: true,
          [weekdayKeyFor(4)]: false,
          days: [
            { date: dateStr(1), status: 'PRESENT' },
            { date: dateStr(2), status: 'JUSTIFIED_ABSENCE' },
            { date: dateStr(3), status: 'UNJUSTIFIED_ABSENCE' },
          ],
          unjustified_absence_count: 1,
        }),
      ])
    );

    const { result } = renderHook(() => useWorkSchedule());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const byDate = new Map(result.current.rows[0].days.map((d) => [d.date, d.state]));
    expect(byDate.get(dateStr(1))).toBe('WORKED');
    expect(byDate.get(dateStr(2))).toBe('JUSTIFIED_ABSENCE');
    expect(byDate.get(dateStr(3))).toBe('UNJUSTIFIED_ABSENCE');
    expect(byDate.get(dateStr(4))).toBe('NOT_SCHEDULED');
    expect(result.current.rows[0].unjustifiedAbsenceCount).toBe(1);
  });

  it('justifyAbsence creates the record then refreshes only that employee row via the single-employee endpoint', async () => {
    vi.mocked(employeeService.getAll).mockResolvedValue([activeLinkedEmployee]);
    vi.mocked(employeeService.getScheduleOverview).mockResolvedValue(
      overview([overviewItem({ days: [{ date: dateStr(3), status: 'UNJUSTIFIED_ABSENCE' }], unjustified_absence_count: 1 })])
    );
    vi.mocked(employeeService.getAttendanceVerification).mockResolvedValue(
      attendance({ days: [{ date: dateStr(3), status: 'JUSTIFIED_ABSENCE' }], unjustified_absence_count: 0 })
    );
    vi.mocked(employeeService.createJustifiedAbsence).mockResolvedValue(undefined);

    const { result } = renderHook(() => useWorkSchedule());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.justifyAbsence('e1', dateStr(3), 'Atestado médico');
    });

    expect(employeeService.createJustifiedAbsence).toHaveBeenCalledWith({
      employee_id: 'e1',
      absence_date: dateStr(3),
      reason: 'Atestado médico',
    });
    // Only the single-employee endpoint is used for the refresh — the bulk overview is not
    // re-fetched just to update one row.
    expect(employeeService.getAttendanceVerification).toHaveBeenCalledTimes(1);
    expect(employeeService.getScheduleOverview).toHaveBeenCalledTimes(1);
    expect(result.current.rows[0].days.find((d) => d.date === dateStr(3))?.state).toBe('JUSTIFIED_ABSENCE');
  });

  it('removeJustification looks up the matching record, deletes it, then refreshes the row', async () => {
    vi.mocked(employeeService.getAll).mockResolvedValue([activeLinkedEmployee]);
    vi.mocked(employeeService.getScheduleOverview).mockResolvedValue(
      overview([overviewItem({ days: [{ date: dateStr(3), status: 'JUSTIFIED_ABSENCE' }], unjustified_absence_count: 0 })])
    );
    vi.mocked(employeeService.getAttendanceVerification).mockResolvedValue(
      attendance({ days: [{ date: dateStr(3), status: 'UNJUSTIFIED_ABSENCE' }], unjustified_absence_count: 1 })
    );
    vi.mocked(employeeService.listJustifiedAbsences).mockResolvedValue([
      { id: 'ja1', employee_id: 'e1', absence_date: dateStr(3), reason: null, created_at: `${dateStr(1)}T00:00:00` },
    ]);
    vi.mocked(employeeService.deleteJustifiedAbsence).mockResolvedValue(undefined);

    const { result } = renderHook(() => useWorkSchedule());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.removeJustification('e1', dateStr(3));
    });

    expect(employeeService.listJustifiedAbsences).toHaveBeenCalledWith({ employee_id: 'e1', month, year });
    expect(employeeService.deleteJustifiedAbsence).toHaveBeenCalledWith('ja1');
    expect(employeeService.getAttendanceVerification).toHaveBeenCalledTimes(1);
    expect(result.current.rows[0].days.find((d) => d.date === dateStr(3))?.state).toBe('UNJUSTIFIED_ABSENCE');
  });

  it('removeJustification throws when no matching record is found instead of silently doing nothing', async () => {
    vi.mocked(employeeService.getAll).mockResolvedValue([activeLinkedEmployee]);
    vi.mocked(employeeService.getScheduleOverview).mockResolvedValue(
      overview([overviewItem({ days: [{ date: dateStr(3), status: 'JUSTIFIED_ABSENCE' }] })])
    );
    vi.mocked(employeeService.listJustifiedAbsences).mockResolvedValue([]);

    const { result } = renderHook(() => useWorkSchedule());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(result.current.removeJustification('e1', dateStr(3))).rejects.toThrow('Justificativa não encontrada');
    expect(employeeService.deleteJustifiedAbsence).not.toHaveBeenCalled();
  });

  it('sets error and produces no rows when the employee list fetch fails', async () => {
    vi.mocked(employeeService.getAll).mockRejectedValue(new Error('network error'));
    vi.mocked(employeeService.getScheduleOverview).mockResolvedValue(overview());

    const { result } = renderHook(() => useWorkSchedule());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe(true);
    expect(result.current.rows).toEqual([]);
  });
});
