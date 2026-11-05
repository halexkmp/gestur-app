import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useTirolesaSetup } from './useTirolesaSetup';
import { tirolesaService } from '../services/tirolesaService';
import { productService } from '../services/productService';
import { Product, TirolesaDevice, TirolesaProduct } from '../types';

vi.mock('../services/tirolesaService');
vi.mock('../services/productService');

const device = (overrides: Partial<TirolesaDevice> = {}): TirolesaDevice => ({
  id: 'd1',
  name: 'Chegada',
  active: true,
  last_seen_at: null,
  offline: true,
  ...overrides,
});

const link: TirolesaProduct = {
  id: 'l1',
  product_id: 'p1',
  product_name: 'Tirolesa Solo',
  units_per_descent: 1,
};

const product = (id: string, active = true): Product => ({
  id,
  name: id,
  type: 'SERVICE',
  default_price: 50,
  stock_quantity: 0,
  active,
  created_at: '2026-11-05',
});

const mockLists = (devices: TirolesaDevice[], links: TirolesaProduct[]) => {
  vi.mocked(tirolesaService.getDevices).mockResolvedValue(devices);
  vi.mocked(tirolesaService.getProducts).mockResolvedValue(links);
  vi.mocked(productService.getAll).mockResolvedValue([product('p1'), product('p2'), product('p3', false)]);
};

const mount = async () => {
  const hook = renderHook(() => useTirolesaSetup());
  await waitFor(() => expect(hook.result.current.loaded).toBe(true));
  return hook;
};

describe('useTirolesaSetup', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('is not pending before the first load finishes', () => {
    vi.mocked(tirolesaService.getDevices).mockReturnValue(new Promise(() => {}));
    vi.mocked(tirolesaService.getProducts).mockReturnValue(new Promise(() => {}));
    vi.mocked(productService.getAll).mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useTirolesaSetup());

    expect(result.current.setupPending).toBe(false);
  });

  it('is pending with no device', async () => {
    mockLists([], [link]);
    const { result } = await mount();
    expect(result.current.setupPending).toBe(true);
  });

  it('is pending with no linked product', async () => {
    mockLists([device()], []);
    const { result } = await mount();
    expect(result.current.setupPending).toBe(true);
  });

  it('an inactive device still counts as registered', async () => {
    mockLists([device({ active: false })], [link]);
    const { result } = await mount();
    expect(result.current.setupPending).toBe(false);
    expect(result.current.hasActiveDevice).toBe(false);
  });

  it('offers only active products not yet linked', async () => {
    mockLists([device()], [link]);
    const { result } = await mount();
    expect(result.current.products.map((p) => p.id)).toEqual(['p2']);
  });

  it('reports a failed load without claiming setup is pending', async () => {
    vi.mocked(tirolesaService.getDevices).mockRejectedValue(new Error('falhou'));
    vi.mocked(tirolesaService.getProducts).mockResolvedValue([]);
    vi.mocked(productService.getAll).mockResolvedValue([]);

    const { result } = renderHook(() => useTirolesaSetup());

    await waitFor(() => expect(result.current.error).toBe('falhou'));
    expect(result.current.setupPending).toBe(false);
  });

  it('returns the key from a new device and reloads the lists', async () => {
    mockLists([], [link]);
    vi.mocked(tirolesaService.createDevice).mockResolvedValue({
      id: 'd1',
      name: 'Chegada',
      active: true,
      created_at: '2026-11-05',
      api_key: 'segredo',
    });
    const { result } = await mount();
    mockLists([device()], [link]);

    let apiKey = '';
    await act(async () => {
      apiKey = (await result.current.createDevice('Chegada')).api_key;
    });

    expect(apiKey).toBe('segredo');
    expect(result.current.setupPending).toBe(false);
  });
});
