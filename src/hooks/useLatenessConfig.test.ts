import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useLatenessConfig } from './useLatenessConfig';
import { latenessConfigService } from '../services/latenessConfigService';

vi.mock('../services/latenessConfigService');

// The API serializes Decimal fields as strings ("2.00"), despite the number type.
const apiConfig = {
  enabled: true,
  expected_entrance_time: '11:00:00Z',
  tolerance_minutes: 10,
  deduction_interval_minutes: 60,
  deduction_value: '5.00',
  late_penalty_hours: '2.00',
  monthly_work_hours: 220,
} as unknown as Awaited<ReturnType<typeof latenessConfigService.get>>;

describe('useLatenessConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should expose late_penalty_hours as a number when the API sends a decimal string', async () => {
    vi.mocked(latenessConfigService.get).mockResolvedValue(apiConfig);

    const { result } = renderHook(() => useLatenessConfig());
    await waitFor(() => expect(result.current.config).not.toBeNull());

    expect(result.current.config?.late_penalty_hours).toBe(2);
    expect(result.current.config?.monthly_work_hours).toBe(220);
  });

  it('should expose late_penalty_hours as a number after saving', async () => {
    vi.mocked(latenessConfigService.get).mockResolvedValue(apiConfig);
    vi.mocked(latenessConfigService.update).mockResolvedValue({ ...apiConfig, late_penalty_hours: '1.50' } as unknown as typeof apiConfig);

    const { result } = renderHook(() => useLatenessConfig());
    await waitFor(() => expect(result.current.config).not.toBeNull());

    await result.current.save({ ...result.current.config!, late_penalty_hours: 1.5 });
    await waitFor(() => expect(result.current.config?.late_penalty_hours).toBe(1.5));
  });
});
