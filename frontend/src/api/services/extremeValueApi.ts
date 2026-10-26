import { apiClient } from '../client';
import { ENDPOINTS } from '../endpoints';
import { ApiResponse } from '../../types/api';
import { ExtremeValueAnalysisData } from '../../types/extremeValue';

export const extremeValueApi = {
  getExtremeValues: (blockType: 'monthly_maxima' | 'daily_maxima' = 'daily_maxima'): Promise<ApiResponse<ExtremeValueAnalysisData>> => {
    return apiClient<ExtremeValueAnalysisData>(`${ENDPOINTS.EXTREME_VALUES.BASE}?block_type=${blockType}`);
  },
  getExportCsvUrl: (blockType: 'monthly_maxima' | 'daily_maxima' = 'daily_maxima'): string => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
    return `${baseUrl}${ENDPOINTS.EXTREME_VALUES.EXPORT_CSV}?block_type=${blockType}`;
  },
};
