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
  it('should call api.post for register', async () => {
    const payload = { latitude: 10, longitude: 20 };
    const response = { id: '1', user_id: 'u1', timestamp: '2024-01-01', ...payload };
    vi.mocked(api.post).mockResolvedValue(response);

    const result = await journeyService.register(payload);

    expect(api.post).toHaveBeenCalledWith('/journey/', payload);
    expect(result).toEqual(response);
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
