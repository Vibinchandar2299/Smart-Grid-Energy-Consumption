import { apiClient } from '../client';
import { ENDPOINTS } from '../endpoints';
import { ApiResponse } from '../../types/api';
import { PeakAnalysisData } from '../../types/segment';

export const peakApi = {
  getPeakAnalysis: (): Promise<ApiResponse<PeakAnalysisData>> => {
    return apiClient<PeakAnalysisData>(ENDPOINTS.PEAK);
  },
};
