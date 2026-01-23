import { api } from '../lib/api';
import { Profile } from '../types';

export const userService = {
  getAll: () => api.get<Profile[]>('/users/'),
  getById: (id: string) => api.get<Profile>(`/users/${id}`),
  create: (user: any) => api.post<Profile>('/users/', user),
  update: (id: string, user: any) => api.patch<Profile>(`/users/${id}`, user),
  delete: (id: string) => api.delete(`/users/${id}`),
};
