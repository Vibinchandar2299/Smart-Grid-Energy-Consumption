import { apiClient } from '../client';
import { ENDPOINTS } from '../endpoints';
import { ApiResponse } from '../../types/api';
import { HourlyAnalysisData } from '../../types/segment';

export const hourlyApi = {
  getHourlyProfiles: (): Promise<ApiResponse<HourlyAnalysisData>> => {
    return apiClient<HourlyAnalysisData>(ENDPOINTS.HOURLY);
  },
};
