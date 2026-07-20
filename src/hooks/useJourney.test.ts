import { renderHook, act } from '@testing-library/react';
import { useJourney } from './useJourney';
import { journeyService } from '../services/journeyService';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../services/journeyService');

describe('useJourney', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch history', async () => {
    const mockHistory = [
      { id: '1', user_id: 'u1', timestamp: '2024-01-01T10:00:00Z', latitude: 10, longitude: 20 },
      { id: '2', user_id: 'u1', timestamp: '2024-01-01T11:00:00Z', latitude: 10, longitude: 20 },
    ];
    vi.mocked(journeyService.getHistory).mockResolvedValue(mockHistory);

    const { result } = renderHook(() => useJourney());

    await act(async () => {
      await result.current.fetchHistory();
    });

    expect(result.current.history).toEqual([mockHistory[0], mockHistory[1]]); // Sorted by timestamp desc (T11 then T10)
    expect(result.current.loading).toBe(false);
  });

  it('should handle registration success', async () => {
    const selfie = new File(['mock-selfie'], 'selfie.jpg', { type: 'image/jpeg' });
    const mockPosition = {
      coords: { latitude: 10, longitude: 20 },
    };
    const mockGeolocation = {
      getCurrentPosition: vi.fn().mockImplementation((success) => success(mockPosition)),
    };
    vi.stubGlobal('navigator', { geolocation: mockGeolocation });

    const mockResponse = { id: '1', user_id: 'u1', timestamp: '2024-01-01', latitude: 10, longitude: 20, selfie_id: 'proof-1' };
    vi.mocked(journeyService.register).mockResolvedValue(mockResponse);
    vi.mocked(journeyService.getHistory).mockResolvedValue([mockResponse]);

    const { result } = renderHook(() => useJourney());

    let regResult;
    await act(async () => {
      regResult = await result.current.registerJourney(selfie);
    });

    expect(regResult).toEqual(mockResponse);
    expect(journeyService.register).toHaveBeenCalledWith({ latitude: 10, longitude: 20, selfie });
    expect(result.current.error).toBe(null);
  });

  it('should block registration when selfie is missing', async () => {
    const { result } = renderHook(() => useJourney());

    await act(async () => {
      await expect(result.current.registerJourney(undefined as unknown as File)).rejects.toThrow(
        'A selfie is required to register your journey.'
      );
    });

    expect(result.current.error).toBe('A selfie is required to register your journey.');
    expect(journeyService.register).not.toHaveBeenCalled();
  });

  it('should handle registration geolocation error', async () => {
    const selfie = new File(['mock-selfie'], 'selfie.jpg', { type: 'image/jpeg' });
    const mockGeolocation = {
      getCurrentPosition: vi.fn().mockImplementation((_, error) => error({ code: 1, PERMISSION_DENIED: 1 })),
    };
    vi.stubGlobal('navigator', { geolocation: mockGeolocation });

    const { result } = renderHook(() => useJourney());

    await act(async () => {
      try {
        await result.current.registerJourney(selfie);
      } catch (e) {
        // expected
      }
    });

    expect(result.current.error).toBe('Location permission denied. Please enable location access.');
  });

  it('should fetch admin history with filters', async () => {
    const mockHistory = [
      { id: '1', user_id: 'u1', timestamp: '2024-01-01T10:00:00Z', latitude: 10, longitude: 20 },
    ];
    vi.mocked(journeyService.getAdminHistory).mockResolvedValue(mockHistory);

    const { result } = renderHook(() => useJourney());

    await act(async () => {
      await result.current.fetchAdminHistory({ user_id: 'u1', start_date: null, end_date: null });
    });

    expect(journeyService.getAdminHistory).toHaveBeenCalledWith({ user_id: 'u1', start_date: null, end_date: null });
    expect(result.current.history).toEqual(mockHistory);
    expect(result.current.loading).toBe(false);
  });

  it('should update a journey record', async () => {
    const updated = { id: '1', user_id: 'u1', timestamp: '2024-01-02T10:00:00Z', latitude: 11, longitude: 21 };
    vi.mocked(journeyService.update).mockResolvedValue(updated);

    const { result } = renderHook(() => useJourney());

    await act(async () => {
      await result.current.updateJourney('1', {
        timestamp: '2024-01-02T10:00:00Z',
        latitude: 11,
        longitude: 21,
        edit_reason: 'Corrected GPS drift',
      });
    });

    expect(journeyService.update).toHaveBeenCalledWith('1', {
      timestamp: '2024-01-02T10:00:00Z',
      latitude: 11,
      longitude: 21,
      edit_reason: 'Corrected GPS drift',
    });
    expect(result.current.error).toBe(null);
  });

  it('should delete a journey record', async () => {
    vi.mocked(journeyService.delete).mockResolvedValue(undefined);

    const { result } = renderHook(() => useJourney());

    await act(async () => {
      await result.current.deleteJourney('1');
    });

    expect(journeyService.delete).toHaveBeenCalledWith('1');
    expect(result.current.error).toBe(null);
  });
});
