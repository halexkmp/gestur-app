import { api } from '../lib/api';
import { Product } from '../types';

export const productService = {
  getAll: () => api.get<Product[]>('/products/'),
  getById: (id: string) => api.get<Product>(`/products/${id}`),
  create: (product: Omit<Product, 'id' | 'created_at'>) => 
    api.post<Product>('/products/', product),
  update: (id: string, product: Partial<Product>) => 
    api.patch<Product>(`/products/${id}`, product),
  delete: (id: string) => api.delete(`/products/${id}`),
};
