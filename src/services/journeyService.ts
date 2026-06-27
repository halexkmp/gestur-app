import { api } from '../lib/api';
import { 
  JourneyResponse, 
  RegisterJourneyRequest, 
  UpdateJourneyRequest, 
  JourneyAdminQueryParams 
} from '../types';

const VALIDATION_ERROR_MESSAGE = '[object Object]';

const buildRegisterPayload = ({ latitude, longitude, selfie }: RegisterJourneyRequest): FormData => {
  const formData = new FormData();
  formData.append('latitude', String(latitude));
  formData.append('longitude', String(longitude));
  formData.append('selfie', selfie);

  return formData;
};

const normalizeRegisterError = (error: unknown): Error => {
  if (error instanceof Error && error.message === VALIDATION_ERROR_MESSAGE) {
    return new Error('Invalid journey data. Please check your selfie and location, then try again.');
  }

  return error instanceof Error ? error : new Error('Failed to register journey');
};

export const journeyService = {
  /**
   * Registers a new journey entry for the authenticated user.
   */
  register: async (payload: RegisterJourneyRequest): Promise<JourneyResponse> => {
    try {
      return await api.post<JourneyResponse>('/journey/', buildRegisterPayload(payload));
    } catch (error) {
      throw normalizeRegisterError(error);
    }
  },

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
