import { apiClient } from '../client';
import { ENDPOINTS } from '../endpoints';
import { ApiResponse } from '../../types/api';

export interface OverviewData {
  dataset_name: string;
  primary_metric: string;
  sample_size: number;
  mean_consumption_kwh: number;
  std_consumption_kwh: number;
  best_fit_distribution: string;
  peak_to_non_peak_ratio: number;
  highest_consuming_sector: string;
  sectors_count: number;
  status: string;
}

export const overviewApi = {
  getOverview: (): Promise<ApiResponse<OverviewData>> => {
    return apiClient<OverviewData>(ENDPOINTS.OVERVIEW);
  },
};
