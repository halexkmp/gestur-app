import { api } from '../lib/api';
import { User } from '../types';

export const userService = {
  getAll: () => api.get<User[]>('/users/'),
  getById: (id: string) => api.get<User>(`/users/${id}`),
  create: (user: any) => api.post<User>('/users/', user),
  update: (id: string, user: any) => api.patch<User>(`/users/${id}`, user),
  delete: (id: string) => api.delete(`/users/${id}`),
};
