import { api } from '../lib/api';
import { Partner, PartnerType } from '../types';

export const partnerService = {
  getAll: () => api.get<Partner[]>('/partners/'),
  create: (partner: any) => api.post<Partner>('/partners/', partner),
  getByType: (type: PartnerType) => api.get<Partner[]>(`/partners/by-type?type=${type}`),
  getById: (id: string) => api.get<Partner>(`/partners/${id}`),
  update: (id: string, partner: any) => api.put<Partner>(`/partners/${id}`, partner),
  delete: (id: string) => api.delete(`/partners/${id}`),
};
