import { apiClient } from '../client';
import { ENDPOINTS } from '../endpoints';
import { ApiResponse } from '../../types/api';
import { TemporalShiftData } from '../../types/segment';

export const temporalApi = {
  getTemporalShift: (): Promise<ApiResponse<TemporalShiftData>> => {
    return apiClient<TemporalShiftData>(ENDPOINTS.TEMPORAL_SHIFT);
  },
};
