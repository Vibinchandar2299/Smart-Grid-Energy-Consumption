import { apiClient } from '../client';
import { ENDPOINTS } from '../endpoints';
import { ApiResponse } from '../../types/api';
import { SeasonalAnalysisData } from '../../types/segment';

export const seasonalApi = {
  getSeasonalAnalysis: (): Promise<ApiResponse<SeasonalAnalysisData>> => {
    return apiClient<SeasonalAnalysisData>(ENDPOINTS.SEASONAL);
  },
};
