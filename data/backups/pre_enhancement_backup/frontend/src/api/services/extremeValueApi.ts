import { apiClient } from '../client';
import { ENDPOINTS } from '../endpoints';
import { ApiResponse } from '../../types/api';
import { ExtremeValueAnalysisData } from '../../types/extremeValue';

export const extremeValueApi = {
  getExtremeValues: (blockType: 'monthly_maxima' | 'daily_maxima' = 'monthly_maxima'): Promise<ApiResponse<ExtremeValueAnalysisData>> => {
    return apiClient<ExtremeValueAnalysisData>(`${ENDPOINTS.EXTREME_VALUES}?block_type=${blockType}`);
  },
};
