import { api } from '../lib/api';
import { PartnerCompany, Bugueiro } from '../types';

export type PartnerType = 'BUGGYMAN' | 'BUSINESS';

export const partnerService = {
  getAll: () => api.get<PartnerCompany[]>('/partners/'),
  getByType: (type: PartnerType) => api.get<PartnerCompany[]>(`/partners/by-type?type=${type}`),
  getById: (id: string) => api.get<PartnerCompany>(`/partners/${id}`),
  update: (id: string, partner: any) => api.put<PartnerCompany>(`/partners/${id}`, partner),
  delete: (id: string) => api.delete(`/partners/${id}`),
};
