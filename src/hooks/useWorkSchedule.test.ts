import { renderHook, act, waitFor } from '@testing-library/react';
import { useWorkSchedule } from './useWorkSchedule';
import { employeeService } from '../services/employeeService';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Employee, AttendanceVerificationResponse } from '../types';

vi.mock('../services/employeeService');

// Deliberately not faking the system clock (fake timers deadlock @testing-library's
// waitFor). Instead, dates are derived from the real "now" so they always line up with
// whatever default month/year the hook itself picks.
const now = new Date();
const year = now.getFullYear();
const month = now.getMonth() + 1;
const pad = (n: number) => String(n).padStart(2, '0');
const dateStr = (day: number) => `${year}-${pad(month)}-${pad(day)}`;

const activeLinkedEmployee: Employee = {
  id: 'e1',
  name: 'Alice',
  salary: 1000,
  active: true,
  start_date: '2020-01-01',
  user_id: 'u1',
};

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

  it('marks inactive employees as NO_DATA for the whole month without fetching schedule', async () => {
    vi.mocked(employeeService.getAll).mockResolvedValue([{ ...activeLinkedEmployee, active: false }]);
    vi.mocked(employeeService.getAttendanceVerification).mockResolvedValue(attendance());

    const { result } = renderHook(() => useWorkSchedule());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.rows[0].days.every((d) => d.state === 'NO_DATA' && d.detail === 'Funcionário inativo')).toBe(true);
    expect(employeeService.getSchedule).not.toHaveBeenCalled();
  });

  it('marks employees with no linked account as NO_DATA without fetching schedule', async () => {
    vi.mocked(employeeService.getAll).mockResolvedValue([{ ...activeLinkedEmployee, user_id: null }]);
    vi.mocked(employeeService.getAttendanceVerification).mockResolvedValue(attendance());

    const { result } = renderHook(() => useWorkSchedule());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.rows[0].days.every((d) => d.state === 'NO_DATA' && d.detail === 'Sem conta vinculada')).toBe(true);
    expect(employeeService.getSchedule).not.toHaveBeenCalled();
  });

  it('treats a not-yet-hired employee as NOT_SCHEDULED without an ambiguous schedule fetch', async () => {
    vi.mocked(employeeService.getAll).mockResolvedValue([{ ...activeLinkedEmployee, start_date: `${year + 5}-01-01` }]);
    vi.mocked(employeeService.getAttendanceVerification).mockResolvedValue(attendance());

    const { result } = renderHook(() => useWorkSchedule());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.rows[0].days.every((d) => d.state === 'NOT_SCHEDULED' && d.detail === 'Antes da contratação')).toBe(true);
    expect(employeeService.getSchedule).not.toHaveBeenCalled();
  });

  it('fetches the schedule only for the ambiguous empty-days case and resolves to NO_DATA when none exists', async () => {
    vi.mocked(employeeService.getAll).mockResolvedValue([activeLinkedEmployee]);
    vi.mocked(employeeService.getAttendanceVerification).mockResolvedValue(attendance());
    vi.mocked(employeeService.getSchedule).mockResolvedValue(null);

    const { result } = renderHook(() => useWorkSchedule());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(employeeService.getSchedule).toHaveBeenCalledWith('e1');
    expect(result.current.rows[0].hasSchedule).toBe(false);
    expect(result.current.rows[0].days.every((d) => d.state === 'NO_DATA' && d.detail === 'Sem escala definida')).toBe(true);
  });

  it('resolves the ambiguous empty-days case to NOT_SCHEDULED/Folga when a real all-false schedule exists', async () => {
    vi.mocked(employeeService.getAll).mockResolvedValue([activeLinkedEmployee]);
    vi.mocked(employeeService.getAttendanceVerification).mockResolvedValue(attendance());
    vi.mocked(employeeService.getSchedule).mockResolvedValue({
      employee_id: 'e1',
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false,
    });

    const { result } = renderHook(() => useWorkSchedule());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.rows[0].hasSchedule).toBe(true);
    expect(result.current.rows[0].days.every((d) => d.state === 'NOT_SCHEDULED' && d.detail === 'Folga')).toBe(true);
  });

  it('does not fetch schedule when attendance-verification already has non-empty days', async () => {
    vi.mocked(employeeService.getAll).mockResolvedValue([activeLinkedEmployee]);
    vi.mocked(employeeService.getAttendanceVerification).mockResolvedValue(
      attendance({ days: [{ date: dateStr(1), status: 'PRESENT' }] })
    );

    const { result } = renderHook(() => useWorkSchedule());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(employeeService.getSchedule).not.toHaveBeenCalled();
    expect(result.current.rows[0].days.find((d) => d.date === dateStr(1))?.state).toBe('WORKED');
  });

  it('treats today as NO_DATA rather than an unjustified absence when nothing has happened yet', async () => {
    const todayStr = dateStr(now.getDate());
    vi.mocked(employeeService.getAll).mockResolvedValue([activeLinkedEmployee]);
    vi.mocked(employeeService.getAttendanceVerification).mockResolvedValue(
      attendance({ days: [{ date: todayStr, status: 'UNJUSTIFIED_ABSENCE' }], unjustified_absence_count: 1 })
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

  it('maps PRESENT/JUSTIFIED_ABSENCE/UNJUSTIFIED_ABSENCE and defaults other scheduled days to NOT_SCHEDULED/Folga', async () => {
    vi.mocked(employeeService.getAll).mockResolvedValue([activeLinkedEmployee]);
    vi.mocked(employeeService.getAttendanceVerification).mockResolvedValue(
      attendance({
        days: [
          { date: dateStr(1), status: 'PRESENT' },
          { date: dateStr(2), status: 'JUSTIFIED_ABSENCE' },
          { date: dateStr(3), status: 'UNJUSTIFIED_ABSENCE' },
        ],
        unjustified_absence_count: 1,
      })
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

  it('justifyAbsence creates the record then refreshes only that employee row', async () => {
    vi.mocked(employeeService.getAll).mockResolvedValue([activeLinkedEmployee]);
    vi.mocked(employeeService.getAttendanceVerification)
      .mockResolvedValueOnce(attendance({ days: [{ date: dateStr(3), status: 'UNJUSTIFIED_ABSENCE' }], unjustified_absence_count: 1 }))
      .mockResolvedValueOnce(attendance({ days: [{ date: dateStr(3), status: 'JUSTIFIED_ABSENCE' }], unjustified_absence_count: 0 }));
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
    expect(employeeService.getAttendanceVerification).toHaveBeenCalledTimes(2);
    expect(result.current.rows[0].days.find((d) => d.date === dateStr(3))?.state).toBe('JUSTIFIED_ABSENCE');
  });

  it('removeJustification looks up the matching record, deletes it, then refreshes the row', async () => {
    vi.mocked(employeeService.getAll).mockResolvedValue([activeLinkedEmployee]);
    vi.mocked(employeeService.getAttendanceVerification)
      .mockResolvedValueOnce(attendance({ days: [{ date: dateStr(3), status: 'JUSTIFIED_ABSENCE' }], unjustified_absence_count: 0 }))
      .mockResolvedValueOnce(attendance({ days: [{ date: dateStr(3), status: 'UNJUSTIFIED_ABSENCE' }], unjustified_absence_count: 1 }));
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
    expect(result.current.rows[0].days.find((d) => d.date === dateStr(3))?.state).toBe('UNJUSTIFIED_ABSENCE');
  });

  it('removeJustification throws when no matching record is found instead of silently doing nothing', async () => {
    vi.mocked(employeeService.getAll).mockResolvedValue([activeLinkedEmployee]);
    vi.mocked(employeeService.getAttendanceVerification).mockResolvedValue(
      attendance({ days: [{ date: dateStr(3), status: 'JUSTIFIED_ABSENCE' }] })
    );
    vi.mocked(employeeService.listJustifiedAbsences).mockResolvedValue([]);

    const { result } = renderHook(() => useWorkSchedule());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(result.current.removeJustification('e1', dateStr(3))).rejects.toThrow('Justificativa não encontrada');
    expect(employeeService.deleteJustifiedAbsence).not.toHaveBeenCalled();
  });

  it('sets error and produces no rows when the employee list fetch fails', async () => {
    vi.mocked(employeeService.getAll).mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() => useWorkSchedule());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe(true);
    expect(result.current.rows).toEqual([]);
  });
});
