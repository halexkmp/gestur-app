import { api } from '../lib/api';
import { User, Role, CreateUserRequest, UpdateUserRequest } from '../types';

export const userService = {
  getAll: () => api.get<User[]>('/users/'),
  getById: (id: string) => api.get<User>(`/users/${id}`),
  getRoles: () => api.get<Role[]>('/roles'),
  create: (user: CreateUserRequest) => api.post<User>('/users/', user),
  update: (id: string, user: UpdateUserRequest) => api.put<User>(`/users/${id}`, user),
  delete: (id: string) => api.delete(`/users/${id}`),
};
