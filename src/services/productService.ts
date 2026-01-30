import { api } from '../lib/api';
import { Product, UpdateStockRequest, StockResponse } from '../types';

export const productService = {
  getAll: () => api.get<Product[]>('/products/'),
  getById: (id: string) => api.get<Product>(`/products/${id}`),
  create: (product: Omit<Product, 'id' | 'created_at'>) => 
    api.post<Product>('/products/', product),
  update: (id: string, product: Partial<Product>) => 
    api.put<Product>(`/products/${id}`, product),
  delete: (id: string) => api.delete(`/products/${id}`),
  updateStock: (data: UpdateStockRequest[]) =>
    api.post<StockResponse[]>('/products/stock/update', data),
  getStockChanges: () =>
    api.get<StockResponse[]>('/products/stock/changes'),
};
