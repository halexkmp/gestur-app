import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { api, ApiError } from './api';

const originalFetch = global.fetch;

function mockFetch(response: { ok: boolean; status: number; json?: () => Promise<unknown> }) {
  global.fetch = vi.fn().mockResolvedValue(response) as unknown as typeof fetch;
}

describe('api', () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: '' },
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('throws an ApiError with the response status and detail message on a non-2xx response', async () => {
    mockFetch({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ detail: 'Not Found' }),
    });

    await expect(api.get('/employees/schedule/xyz')).rejects.toMatchObject({
      message: 'Not Found',
      status: 404,
    });
    await expect(api.get('/employees/schedule/xyz')).rejects.toBeInstanceOf(ApiError);
  });

  it('falls back to a generic message and still carries the status when the error body is unparsable', async () => {
    mockFetch({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('invalid json')),
    });

    await expect(api.get('/employees/')).rejects.toMatchObject({
      message: 'An error occurred',
      status: 500,
    });
  });

  it('resolves 204 responses to an empty object', async () => {
    mockFetch({
      ok: true,
      status: 204,
    });

    await expect(api.delete('/employees/justified-absences/abc')).resolves.toEqual({});
  });

  it('clears the auth token and redirects on a 401 response', async () => {
    localStorage.setItem('auth_token', 'some-token');
    mockFetch({
      ok: false,
      status: 401,
    });

    await expect(api.get('/employees/')).rejects.toThrow('Unauthorized');
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(window.location.href).toBe('/login');
  });
});
