import { PeriodPresetId } from '../types';

/**
 * Formats a monetary value as Brazilian Real.
 *
 * The API returns money as a decimal *string* ("1234.50", "0.00") — see
 * specs/api/shared.md. `String.prototype.toLocaleString` takes no arguments and
 * silently ignores an options object, so calling it directly on a string returns
 * the string unchanged instead of a formatted amount. The `Number()` coercion
 * below is therefore mandatory, not defensive.
 */
export const formatCurrency = (value: string | number): string => {
  const amount = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(amount)) return 'R$ 0,00';
  return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

/**
 * Formats a Date as "YYYY-MM-DD" using its **local** calendar parts.
 *
 * `toISOString().split('T')[0]` yields the UTC day, which in UTC-3 reports
 * tomorrow's date after 21:00 local — enough to push a "current month" preset
 * into the wrong month on the last evening of a month.
 */
export const toISODateLocal = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

/** Formats a "YYYY-MM-DD" API date as "DD/MM/YYYY" without a timezone shift. */
export const formatDateBR = (date: string): string =>
  new Date(`${date.split('T')[0]}T12:00:00`).toLocaleDateString('pt-BR');

/**
 * Whole days a "YYYY-MM-DD" due date is in the past; 0 when due today or later.
 *
 * Both dates are anchored at local noon before diffing — the same technique
 * `formatDateBR` uses above. A midnight anchor sits close enough to the day
 * boundary that a DST shift, or simply a late-evening "now", can push the
 * difference across a whole day; noon leaves 12 hours of slack either side, so
 * `Math.round` recovers the exact whole-day count.
 *
 * Never returns a negative value: an installment due today or in the future is
 * not overdue at all, which callers render as "not overdue" rather than
 * "overdue by -3 days".
 */
export const daysOverdue = (dueDate: string): number => {
  const due = new Date(`${dueDate.split('T')[0]}T12:00:00`);
  if (Number.isNaN(due.getTime())) return 0;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);

  const elapsedMs = today.getTime() - due.getTime();
  if (elapsedMs <= 0) return 0;

  return Math.round(elapsedMs / 86_400_000);
};

/**
 * Resolves a preset to an inclusive [startDate, endDate] pair of local
 * "YYYY-MM-DD" dates. `custom` returns today for both — callers keep their own
 * dates in that case.
 */
export const periodPresetRange = (
  preset: PeriodPresetId
): { startDate: string; endDate: string } => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  switch (preset) {
    case 'previous-month':
      return {
        startDate: toISODateLocal(new Date(year, month - 1, 1)),
        endDate: toISODateLocal(new Date(year, month, 0)),
      };
    case 'current-quarter': {
      const firstMonthOfQuarter = Math.floor(month / 3) * 3;
      return {
        startDate: toISODateLocal(new Date(year, firstMonthOfQuarter, 1)),
        endDate: toISODateLocal(new Date(year, firstMonthOfQuarter + 3, 0)),
      };
    }
    case 'current-year':
      return {
        startDate: toISODateLocal(new Date(year, 0, 1)),
        endDate: toISODateLocal(new Date(year, 11, 31)),
      };
    case 'next-30-days':
      return {
        startDate: toISODateLocal(now),
        endDate: toISODateLocal(new Date(year, month, now.getDate() + 29)),
      };
    case 'custom':
      return { startDate: toISODateLocal(now), endDate: toISODateLocal(now) };
    case 'current-month':
    default:
      return {
        startDate: toISODateLocal(new Date(year, month, 1)),
        endDate: toISODateLocal(new Date(year, month + 1, 0)),
      };
  }
};

/**
 * Converts a "HH:MM:SS" (optionally with a trailing "Z") UTC wall-clock time
 * into the browser's local wall-clock time, for display in a plain
 * <input type="time">.
 */
export const utcTimeStringToLocal = (time: string): string => {
  const [hours, minutes, seconds = 0] = time.replace(/Z$/, '').split(':').map(Number);
  const reference = new Date();
  reference.setUTCHours(hours, minutes, seconds, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(reference.getHours())}:${pad(reference.getMinutes())}:${pad(reference.getSeconds())}`;
};

/**
 * Appends the browser's current UTC offset (e.g. "-03:00") to a local
 * "HH:MM:SS" wall-clock time, per specs/api/employees.md's PUT
 * /employees/lateness-config offset format.
 */
export const localTimeStringWithUtcOffset = (time: string): string => {
  const offsetMinutes = -new Date().getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMinutes);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${time}${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
};
