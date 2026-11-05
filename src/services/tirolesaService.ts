import { api } from '../lib/api';
import {
  CreateJustificationRequest,
  TirolesaAuditDay,
  TirolesaCreatedDevice,
  TirolesaDevice,
  TirolesaProduct,
} from '../types';

export const tirolesaService = {
  getAuditDay: async (date: string): Promise<TirolesaAuditDay> => {
    const days = await api.get<TirolesaAuditDay[]>('/tirolesa/audit', {
      params: { date_from: date, date_to: date },
    });
    if (days.length === 0) {
      throw new Error('Auditoria não encontrada para este dia');
    }
    return days[0];
  },
  createJustification: (payload: CreateJustificationRequest) =>
    api.post('/tirolesa/audit/justifications', payload),
  deleteJustification: (id: string) => api.delete(`/tirolesa/audit/justifications/${id}`),
  getDevices: () => api.get<TirolesaDevice[]>('/tirolesa/devices'),
  createDevice: (name: string) => api.post<TirolesaCreatedDevice>('/tirolesa/devices', { name }),
  updateDevice: (id: string, payload: { name?: string; active?: boolean }) =>
    api.put(`/tirolesa/devices/${id}`, payload),
  getProducts: () => api.get<TirolesaProduct[]>('/tirolesa/products'),
  linkProduct: (productId: string, unitsPerDescent: number) =>
    api.post('/tirolesa/products', { product_id: productId, units_per_descent: unitsPerDescent }),
  unlinkProduct: (id: string) => api.delete(`/tirolesa/products/${id}`),
};
