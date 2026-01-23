import { api } from '../lib/api';
import { Sale } from '../types';

export const saleService = {
  getAll: () => api.get<Sale[]>('/sales/'),
  getById: (id: string) => api.get<Sale>(`/sales/${id}`),
  create: (sale: any) => api.post<Sale>('/sales/', sale),
  update: (id: string, sale: any) => api.patch<Sale>(`/sales/${id}`, sale),
  delete: (id: string) => api.delete(`/sales/${id}`),
};
