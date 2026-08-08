import { useCallback, useEffect, useRef, useState } from 'react';
import { loanService } from '../services/loanService';
import { LoanPeriodSummary, PeriodPresetId } from '../types';
import { periodPresetRange } from '../lib/formatters';

const DEFAULT_PRESET: PeriodPresetId = 'current-month';

export const useLoanPeriodSummary = () => {
  const initialRange = periodPresetRange(DEFAULT_PRESET);

  const [startDate, setStartDate] = useState<string>(initialRange.startDate);
  const [endDate, setEndDate] = useState<string>(initialRange.endDate);
  const [preset, setPreset] = useState<PeriodPresetId>(DEFAULT_PRESET);
  const [summary, setSummary] = useState<LoanPeriodSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Dates are zero-padded YYYY-MM-DD, so a plain string comparison is correct.
  const invalidRange = endDate < startDate;

  // Only the newest request may write state: fetch has no cancellation here, so
  // a slow earlier range must not overwrite a newer one.
  const requestIdRef = useRef<number>(0);
  const hasDataRef = useRef<boolean>(false);

  const fetchSummary = useCallback(async () => {
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
      const data = await loanService.getPeriodSummary({
        start_date: startDate,
        end_date: endDate,
      });
      if (requestIdRef.current !== requestId) return;
      setSummary(data);
      hasDataRef.current = true;
    } catch (err) {
      if (requestIdRef.current !== requestId) return;
      setError(
        err instanceof Error ? err.message : 'Não foi possível carregar o resumo.'
      );
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

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

  return {
    summary,
    startDate,
    endDate,
    preset,
    setRange,
    applyPreset,
    invalidRange,
    loading,
    refreshing,
    error,
    refetch: fetchSummary,
  };
};
