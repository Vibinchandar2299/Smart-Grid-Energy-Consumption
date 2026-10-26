import { apiClient } from '../client';
import { ENDPOINTS } from '../endpoints';
import { ApiResponse } from '../../types/api';
import { DistributionComparisonData, CurvePoint } from '../../types/distribution';

export const distributionApi = {
  getComparison: (): Promise<ApiResponse<DistributionComparisonData>> => {
    return apiClient<DistributionComparisonData>(ENDPOINTS.DISTRIBUTIONS.COMPARE);
  },
  getCurves: (points: number = 100): Promise<ApiResponse<CurvePoint[]>> => {
    return apiClient<CurvePoint[]>(`${ENDPOINTS.DISTRIBUTIONS.CURVES}?points=${points}`);
  },
  getExportCsvUrl: (): string => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
    return `${baseUrl}${ENDPOINTS.DISTRIBUTIONS.EXPORT_CSV}`;
  },
};
