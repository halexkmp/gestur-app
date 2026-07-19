import { api } from '../lib/api';
import { LatenessConfig } from '../types';

export const latenessConfigService = {
  get: () => api.get<LatenessConfig>('/employees/lateness-config'),
  update: (payload: LatenessConfig) => api.put<LatenessConfig>('/employees/lateness-config', payload),
};
