export interface JourneyResponse {
  id: string;
  user_id: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  selfie_id?: string | null;
}

export interface RegisterJourneyRequest {
  latitude: number;
  longitude: number;
  selfie: File;
}

export interface UpdateJourneyRequest {
  latitude?: number | null;
  longitude?: number | null;
  timestamp?: string | null;
  edit_reason: string;
}

export interface JourneyAdminQueryParams {
  user_id?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}
