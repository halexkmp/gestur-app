import { useCallback, useEffect, useMemo, useState } from 'react';
import { tirolesaService } from '../services/tirolesaService';
import { productService } from '../services/productService';
import { Product, TirolesaCreatedDevice, TirolesaDevice, TirolesaProduct } from '../types';

export const useTirolesaSetup = () => {
  const [devices, setDevices] = useState<TirolesaDevice[]>([]);
  const [links, setLinks] = useState<TirolesaProduct[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextDevices, nextLinks, nextProducts] = await Promise.all([
        tirolesaService.getDevices(),
        tirolesaService.getProducts(),
        productService.getAll(),
      ]);
      setDevices(nextDevices);
      setLinks(nextLinks);
      setAllProducts(nextProducts);
      setLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar a configuração');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const products = useMemo(() => {
    const linkedIds = new Set(links.map((link) => link.product_id));
    return allProducts.filter((product) => product.active && !linkedIds.has(product.id));
  }, [allProducts, links]);

  const createDevice = useCallback(
    async (name: string): Promise<TirolesaCreatedDevice> => {
      const device = await tirolesaService.createDevice(name);
      await reload();
      return device;
    },
    [reload],
  );

  const setDeviceActive = useCallback(
    async (id: string, active: boolean) => {
      await tirolesaService.updateDevice(id, { active });
      await reload();
    },
    [reload],
  );

  const linkProduct = useCallback(
    async (productId: string, unitsPerDescent: number) => {
      await tirolesaService.linkProduct(productId, unitsPerDescent);
      await reload();
    },
    [reload],
  );

  const unlinkProduct = useCallback(
    async (id: string) => {
      await tirolesaService.unlinkProduct(id);
      await reload();
    },
    [reload],
  );

  return {
    devices,
    links,
    products,
    loading,
    loaded,
    error,
    setupPending: loaded && (devices.length === 0 || links.length === 0),
    hasActiveDevice: devices.some((device) => device.active),
    reload,
    createDevice,
    setDeviceActive,
    linkProduct,
    unlinkProduct,
  };
};
