import { useCallback, useEffect, useState } from 'react';
import { latenessConfigService } from '../services/latenessConfigService';
import { localTimeStringWithUtcOffset, utcTimeStringToLocal } from '../lib/formatters';
import { LatenessConfig } from '../types';

export const useLatenessConfig = () => {
  const [config, setConfig] = useState<LatenessConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await latenessConfigService.get();
      setConfig({ ...data, expected_entrance_time: utcTimeStringToLocal(data.expected_entrance_time) });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch lateness configuration');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const validate = (values: LatenessConfig): string | null => {
    if (!values.expected_entrance_time) {
      return 'Informe o horário de entrada esperado.';
    }
    if (values.tolerance_minutes < 0) {
      return 'A tolerância não pode ser negativa.';
    }
    if (values.deduction_interval_minutes <= 0) {
      return 'O intervalo de desconto deve ser maior que zero.';
    }
    if (values.deduction_value < 0) {
      return 'O valor do desconto não pode ser negativo.';
    }
    return null;
  };

  const save = useCallback(async (values: LatenessConfig): Promise<boolean> => {
    const validationError = validate(values);
    if (validationError) {
      setError(validationError);
      return false;
    }

    setLoading(true);
    setError(null);
    try {
      const payload: LatenessConfig = {
        ...values,
        expected_entrance_time: localTimeStringWithUtcOffset(values.expected_entrance_time),
      };
      const updated = await latenessConfigService.update(payload);
      setConfig({ ...updated, expected_entrance_time: utcTimeStringToLocal(updated.expected_entrance_time) });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save lateness configuration');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { config, loading, error, save };
};
