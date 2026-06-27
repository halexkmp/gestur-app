import { useState, useCallback } from 'react';
import { journeyService } from '../services/journeyService';
import { JourneyResponse, JourneyAdminQueryParams, UpdateJourneyRequest } from '../types';

export const useJourney = () => {
  const [history, setHistory] = useState<JourneyResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await journeyService.getHistory();
      setHistory(data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch journey history');
    } finally {
      setLoading(false);
    }
  }, []);

  const registerJourney = useCallback(async (selfie: File) => {
    if (!selfie) {
      const msg = 'A selfie is required to register your journey.';
      setError(msg);
      throw new Error(msg);
    }

    setLoading(true);
    setError(null);

    return new Promise<JourneyResponse>((resolve, reject) => {
      if (!navigator.geolocation) {
        const err = new Error('Geolocation is not supported by your browser');
        setError(err.message);
        setLoading(false);
        return reject(err);
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const result = await journeyService.register({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              selfie,
            });
            await fetchHistory();
            resolve(result);
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to register journey';
            setError(msg);
            reject(new Error(msg));
          } finally {
            setLoading(false);
          }
        },
        (geoErr) => {
          let msg = 'Failed to get location';
          if (geoErr.code === geoErr.PERMISSION_DENIED) {
            msg = 'Location permission denied. Please enable location access.';
          }
          setError(msg);
          setLoading(false);
          reject(new Error(msg));
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }, [fetchHistory]);

  const fetchAdminHistory = useCallback(async (params?: JourneyAdminQueryParams) => {
    setLoading(true);
    setError(null);
    try {
      const data = await journeyService.getAdminHistory(params);
      setHistory(data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch admin journey history');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateJourney = useCallback(async (id: string, payload: UpdateJourneyRequest) => {
    setLoading(true);
    setError(null);
    try {
      await journeyService.update(id, payload);
      // We don't necessarily know the filters used for the current history state, 
      // but usually this is used in Admin view where we might want to refresh.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update journey');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteJourney = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await journeyService.delete(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete journey');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    history,
    loading,
    error,
    fetchHistory,
    registerJourney,
    fetchAdminHistory,
    updateJourney,
    deleteJourney,
  };
};
