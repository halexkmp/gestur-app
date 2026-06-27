import { describe, it, expect, vi } from 'vitest';
import { journeyService } from './journeyService';
import { api } from '../lib/api';

vi.mock('../lib/api', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('journeyService', () => {
  it('should call api.post with FormData for register', async () => {
    const selfie = new File(['mock-selfie'], 'selfie.jpg', { type: 'image/jpeg' });
    const payload = { latitude: 10, longitude: 20, selfie };
    const response = { id: '1', user_id: 'u1', timestamp: '2024-01-01', latitude: 10, longitude: 20, selfie_id: 'proof-1' };
    vi.mocked(api.post).mockResolvedValue(response);

    const result = await journeyService.register(payload);

    const registerPayload = vi.mocked(api.post).mock.calls[0][1] as FormData;

    expect(api.post).toHaveBeenCalledWith('/journey/', expect.any(FormData));
    expect(registerPayload.get('latitude')).toBe('10');
    expect(registerPayload.get('longitude')).toBe('20');
    expect(registerPayload.get('selfie')).toBe(selfie);
    expect(result).toEqual(response);
  });

  it('should normalize 422-like validation errors on register', async () => {
    const payload = {
      latitude: 10,
      longitude: 20,
      selfie: new File(['mock-selfie'], 'selfie.jpg', { type: 'image/jpeg' }),
    };
    vi.mocked(api.post).mockRejectedValue(new Error('[object Object]'));

    await expect(journeyService.register(payload)).rejects.toThrow(
      'Invalid journey data. Please check your selfie and location, then try again.'
    );
  });

  it('should call api.get for getHistory', async () => {
    const response = [{ id: '1', user_id: 'u1', timestamp: '2024-01-01', latitude: 10, longitude: 20 }];
    vi.mocked(api.get).mockResolvedValue(response);

    const result = await journeyService.getHistory();

    expect(api.get).toHaveBeenCalledWith('/journey/');
    expect(result).toEqual(response);
  });

  it('should call api.get with params for getAdminHistory', async () => {
    const params = { user_id: 'u1' };
    const response = [{ id: '1', user_id: 'u1', timestamp: '2024-01-01', latitude: 10, longitude: 20 }];
    vi.mocked(api.get).mockResolvedValue(response);

    const result = await journeyService.getAdminHistory(params);

    expect(api.get).toHaveBeenCalledWith('/journey/admin', { params });
    expect(result).toEqual(response);
  });

  it('should call api.patch for update', async () => {
    const id = '1';
    const payload = { edit_reason: 'Fixed typo', latitude: 11 };
    const response = { id, user_id: 'u1', timestamp: '2024-01-01', latitude: 11, longitude: 20 };
    vi.mocked(api.patch).mockResolvedValue(response);

    const result = await journeyService.update(id, payload);

    expect(api.patch).toHaveBeenCalledWith(`/journey/${id}`, payload);
    expect(result).toEqual(response);
  });

  it('should call api.delete for delete', async () => {
    const id = '1';
    vi.mocked(api.delete).mockResolvedValue({});

    await journeyService.delete(id);

    expect(api.delete).toHaveBeenCalledWith(`/journey/${id}`);
  });
});
