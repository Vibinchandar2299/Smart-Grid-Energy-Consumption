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
};
