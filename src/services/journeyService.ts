import { api } from '../lib/api';
import { 
  JourneyResponse, 
  RegisterJourneyRequest, 
  UpdateJourneyRequest, 
  JourneyAdminQueryParams 
} from '../types';

export const journeyService = {
  /**
   * Registers a new journey entry for the authenticated user.
   */
  register: (payload: RegisterJourneyRequest): Promise<JourneyResponse> => 
    api.post<JourneyResponse>('/journey/', payload),

  /**
   * Retrieves journey history for the authenticated user.
   */
  getHistory: (): Promise<JourneyResponse[]> => 
    api.get<JourneyResponse[]>('/journey/'),

  /**
   * (Admin) Retrieves journey records with optional filtering.
   */
  getAdminHistory: (params?: JourneyAdminQueryParams): Promise<JourneyResponse[]> => 
    api.get<JourneyResponse[]>('/journey/admin', { params }),

  /**
   * (Admin) Updates an existing journey entry.
   */
  update: (id: string, payload: UpdateJourneyRequest): Promise<JourneyResponse> => 
    api.patch<JourneyResponse>(`/journey/${id}`, payload),

  /**
   * (Admin) Deletes (soft delete) a journey entry.
   */
  delete: (id: string): Promise<void> => 
    api.delete(`/journey/${id}`),
};
