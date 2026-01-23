import { api } from '../lib/api';
import { PartnerCompany, Bugueiro } from '../types';

export const partnerService = {
  // Bugueiros are mapped to Partners in the backend
  getBugueiros: () => api.get<Bugueiro[]>('/partners/'),
  getBugueiroById: (id: string) => api.get<Bugueiro>(`/partners/${id}`),
  // Note: OpenAPI missing POST/PATCH for partners, assuming they might be added or handled differently.
  // For now, providing what's in the spec.
  
  // Partner Companies - existing code used Firestore 'partner_companies'
  // Backend OpenAPI seems to have only '/partners/' which I've mapped to Bugueiros.
  // If there's no specific route for partner companies, they might be a type of partner or not yet implemented in backend.
  // I will assume for now they might use the same /partners/ route or need a different one.
};
