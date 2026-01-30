import { api } from '../lib/api';
import { Sale } from '../types';

export const saleService = {
  getAll: () => api.get<Sale[]>('/sales/'),
  getById: (id: string) => api.get<Sale>(`/sales/${id}`),
  create: (sale: any) => api.post<Sale>('/sales/', sale),
  update: (id: string, sale: any) => api.put<Sale>(`/sales/${id}`, sale),
  delete: (id: string) => api.delete(`/sales/${id}`),
  getReport: (params: { 
    date_from?: string; 
    date_to?: string; 
    user_id?: string; 
    product_id?: string; 
    partner_id?: string; 
  }) => api.get<Sale[]>('/reports/sales', { params }),
};
