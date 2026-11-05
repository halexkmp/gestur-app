import { useCallback, useEffect, useRef, useState } from 'react';
import { tirolesaService } from '../services/tirolesaService';
import { TirolesaAuditDay, TirolesaJustificationType } from '../types';
import { shiftISODate, toISODateLocal } from '../lib/formatters';

const DAY_CHECK_INTERVAL_MS = 60_000;

const currentYesterday = (): string => shiftISODate(toISODateLocal(new Date()), -1);

export const useTirolesaAudit = () => {
  const [today, setToday] = useState<string>(() => toISODateLocal(new Date()));
  const yesterday = shiftISODate(today, -1);

  const [selectedDate, setSelectedDate] = useState<string>(currentYesterday);
  const [day, setDay] = useState<TirolesaAuditDay | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Only the newest request may write state: moving quickly between days must
  // not let a slow earlier day overwrite the one on screen.
  const requestIdRef = useRef<number>(0);

  // Read through refs so a reload started by an action that finishes after the
  // admin changed day fetches the day now on screen, not the day it began on.
  const selectedDateRef = useRef<string>(selectedDate);
  selectedDateRef.current = selectedDate;
  const todayRef = useRef<string>(today);

  const reload = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    setError(null);

    try {
      const data = await tirolesaService.getAuditDay(selectedDateRef.current);
      if (requestIdRef.current !== requestId) return;
      setDay(data);
    } catch (err) {
      if (requestIdRef.current !== requestId) return;
      setDay(null);
      setError(err instanceof Error ? err.message : 'Erro ao carregar a auditoria');
    } finally {
      if (requestIdRef.current === requestId) setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload, selectedDate]);

  // A review tab is often left open overnight, and nothing else re-renders it.
  const syncToday = useCallback(() => {
    const previousToday = todayRef.current;
    const now = toISODateLocal(new Date());
    if (now === previousToday) return;

    todayRef.current = now;
    setToday(now);

    if (selectedDateRef.current === shiftISODate(previousToday, -1)) {
      setSelectedDate(shiftISODate(now, -1));
    } else if (selectedDateRef.current === previousToday) {
      reload();
    }
  }, [reload]);

  useEffect(() => {
    window.addEventListener('focus', syncToday);
    document.addEventListener('visibilitychange', syncToday);
    const timer = window.setInterval(syncToday, DAY_CHECK_INTERVAL_MS);
    return () => {
      window.removeEventListener('focus', syncToday);
      document.removeEventListener('visibilitychange', syncToday);
      window.clearInterval(timer);
    };
  }, [syncToday]);

  const goToPreviousDay = useCallback(() => {
    setSelectedDate((current) => shiftISODate(current, -1));
  }, []);

  const goToNextDay = useCallback(() => {
    setSelectedDate((current) => {
      const now = toISODateLocal(new Date());
      return current < now ? shiftISODate(current, 1) : current;
    });
  }, []);

  const goToYesterday = useCallback(() => {
    const target = currentYesterday();
    if (target === selectedDateRef.current) {
      reload();
    } else {
      setSelectedDate(target);
    }
  }, [reload]);

  const addJustification = useCallback(
    async (quantity: number, type: TirolesaJustificationType, reason: string) => {
      await tirolesaService.createJustification({
        audit_date: selectedDate,
        quantity,
        type,
        reason: reason.trim(),
      });
      await reload();
    },
    [reload, selectedDate],
  );

  const removeJustification = useCallback(
    async (id: string) => {
      await tirolesaService.deleteJustification(id);
      await reload();
    },
    [reload],
  );

  return {
    selectedDate,
    isToday: selectedDate === today,
    isYesterday: selectedDate === yesterday,
    day,
    loading,
    error,
    goToPreviousDay,
    goToNextDay,
    goToYesterday,
    reload,
    addJustification,
    removeJustification,
  };
};
