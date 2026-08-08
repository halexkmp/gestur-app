import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatCurrency, toISODateLocal, periodPresetRange } from './formatters';

// Intl separates "R$" from the amount with a non-breaking space (U+00A0, or
// U+202F in some ICU builds); normalise it so assertions read plainly.
const normalize = (value: string) => value.replace(/[\u00A0\u202F]/g, ' ');

describe('formatCurrency', () => {
  it('formats a decimal string as BRL', () => {
    // The API returns money as a string. String.prototype.toLocaleString ignores
    // its options argument, so without coercion this would return "1234.50".
    expect(normalize(formatCurrency('1234.50'))).toBe('R$ 1.234,50');
  });

  it('formats a zero string rather than passing it through', () => {
    expect(normalize(formatCurrency('0.00'))).toBe('R$ 0,00');
  });

  it('formats a number', () => {
    expect(normalize(formatCurrency(1234.5))).toBe('R$ 1.234,50');
  });

  it('falls back to zero for a non-numeric value', () => {
    expect(normalize(formatCurrency('abc'))).toBe('R$ 0,00');
  });
});

describe('toISODateLocal', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses local calendar parts, not the UTC day', () => {
    // 23:30 local on the last day of August. toISOString() would report
    // 2026-09-01 in UTC-3 and push a "current month" preset into September.
    const lateEvening = new Date(2026, 7, 31, 23, 30, 0);
    expect(toISODateLocal(lateEvening)).toBe('2026-08-31');
  });

  it('zero-pads single-digit months and days', () => {
    expect(toISODateLocal(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('periodPresetRange', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const freezeAt = (date: Date) => {
    vi.useFakeTimers();
    vi.setSystemTime(date);
  };

  it('resolves the current month to its first and last day', () => {
    freezeAt(new Date(2026, 7, 8, 12, 0, 0));
    expect(periodPresetRange('current-month')).toEqual({
      startDate: '2026-08-01',
      endDate: '2026-08-31',
    });
  });

  it('resolves the previous month, including a short one', () => {
    freezeAt(new Date(2026, 2, 15, 12, 0, 0));
    expect(periodPresetRange('previous-month')).toEqual({
      startDate: '2026-02-01',
      endDate: '2026-02-28',
    });
  });

  it('resolves the current quarter', () => {
    freezeAt(new Date(2026, 7, 8, 12, 0, 0));
    expect(periodPresetRange('current-quarter')).toEqual({
      startDate: '2026-07-01',
      endDate: '2026-09-30',
    });
  });

  it('resolves the current year', () => {
    freezeAt(new Date(2026, 7, 8, 12, 0, 0));
    expect(periodPresetRange('current-year')).toEqual({
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    });
  });

  it('resolves the next 30 days inclusive of today', () => {
    freezeAt(new Date(2026, 7, 8, 12, 0, 0));
    expect(periodPresetRange('next-30-days')).toEqual({
      startDate: '2026-08-08',
      endDate: '2026-09-06',
    });
  });
});
