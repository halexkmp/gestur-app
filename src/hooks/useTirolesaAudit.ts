import { useCallback, useEffect, useRef, useState } from 'react';
import { tirolesaService } from '../services/tirolesaService';
import { TirolesaAuditDay, TirolesaJustificationType } from '../types';
import { shiftISODate, toISODateLocal } from '../lib/formatters';

const currentYesterday = (): string => shiftISODate(toISODateLocal(new Date()), -1);

export const useTirolesaAudit = () => {
  // Worked out on every render, so a page left open past midnight stays correct.
  const today = toISODateLocal(new Date());
  const yesterday = shiftISODate(today, -1);

  const [selectedDate, setSelectedDate] = useState<string>(currentYesterday);
  const [day, setDay] = useState<TirolesaAuditDay | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Only the newest request may write state: moving quickly between days must
  // not let a slow earlier day overwrite the one on screen.
  const requestIdRef = useRef<number>(0);

  const reload = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    setError(null);

    try {
      const data = await tirolesaService.getAuditDay(selectedDate);
      if (requestIdRef.current !== requestId) return;
      setDay(data);
    } catch (err) {
      if (requestIdRef.current !== requestId) return;
      setDay(null);
      setError(err instanceof Error ? err.message : 'Erro ao carregar a auditoria');
    } finally {
      if (requestIdRef.current === requestId) setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    reload();
  }, [reload]);

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
    setSelectedDate(currentYesterday());
  }, []);

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
