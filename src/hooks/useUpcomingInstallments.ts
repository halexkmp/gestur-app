import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { loanService } from '../services/loanService';
import { UpcomingInstallment, PeriodPresetId } from '../types';
import { periodPresetRange } from '../lib/formatters';

// This tab answers "what is coming", so it opens on a forward-looking window
// rather than the current calendar month the summary tab reports on.
const DEFAULT_PRESET: PeriodPresetId = 'next-30-days';

/**
 * Sums decimal-string amounts without float drift.
 *
 * The API guarantees exactly two decimals on every money field, so scaling each
 * value to an integer number of cents before accumulating is exact —
 * `0.10 + 0.20 + 0.30` added as floats yields 0.6000000000000001, which is
 * visible once the result is rendered as currency.
 */
const sumAmounts = (values: string[]): number => {
  const cents = values.reduce((total, value) => {
    const amount = Number(value);
    return Number.isFinite(amount) ? total + Math.round(amount * 100) : total;
  }, 0);
  return cents / 100;
};

export const useUpcomingInstallments = () => {
  const initialRange = periodPresetRange(DEFAULT_PRESET);

  const [startDate, setStartDate] = useState<string>(initialRange.startDate);
  const [endDate, setEndDate] = useState<string>(initialRange.endDate);
  const [preset, setPreset] = useState<PeriodPresetId>(DEFAULT_PRESET);
  const [installments, setInstallments] = useState<UpcomingInstallment[] | null>(null);
  const [includeOverdue, setIncludeOverdue] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Dates are zero-padded YYYY-MM-DD, so a plain string comparison is correct.
  const invalidRange = endDate < startDate;

  // Only the newest request may write state: fetch has no cancellation here, so
  // a slow earlier range must not overwrite a newer one.
  const requestIdRef = useRef<number>(0);
  const hasDataRef = useRef<boolean>(false);

  const fetchInstallments = useCallback(async () => {
    if (endDate < startDate) return;

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (hasDataRef.current) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await loanService.getUpcomingInstallments({
        start_date: startDate,
        end_date: endDate,
        include_overdue: includeOverdue,
      });
      if (requestIdRef.current !== requestId) return;
      setInstallments(data);
      hasDataRef.current = true;
    } catch (err) {
      if (requestIdRef.current !== requestId) return;
      setError(
        err instanceof Error ? err.message : 'Não foi possível carregar as parcelas.'
      );
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [startDate, endDate, includeOverdue]);

  useEffect(() => {
    fetchInstallments();
  }, [fetchInstallments]);

  const setRange = useCallback((nextStart: string, nextEnd: string) => {
    setStartDate(nextStart);
    setEndDate(nextEnd);
    setPreset('custom');
  }, []);

  const applyPreset = useCallback((nextPreset: PeriodPresetId) => {
    const range = periodPresetRange(nextPreset);
    setStartDate(range.startDate);
    setEndDate(range.endDate);
    setPreset(nextPreset);
  }, []);

  const rowCount = installments?.length ?? 0;

  const totalOutstanding = useMemo(
    () => sumAmounts((installments ?? []).map((row) => row.remaining_amount)),
    [installments]
  );

  // Counted from the server's own flag, never from comparing due dates to the
  // selected range: `is_overdue` is evaluated against the server's date.
  const overdueCount = useMemo(
    () => (installments ?? []).filter((row) => row.is_overdue).length,
    [installments]
  );

  // Distinct from "not loaded yet" — deriving this from length alone would flash
  // the empty state during the very first load.
  const isEmpty = installments !== null && installments.length === 0;

  return {
    installments,
    rowCount,
    totalOutstanding,
    overdueCount,
    startDate,
    endDate,
    preset,
    includeOverdue,
    setRange,
    applyPreset,
    setIncludeOverdue,
    invalidRange,
    isEmpty,
    loading,
    refreshing,
    error,
    refetch: fetchInstallments,
  };
};
