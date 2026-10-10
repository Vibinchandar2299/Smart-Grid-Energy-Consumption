import { apiClient } from '../client';
import { ENDPOINTS } from '../endpoints';
import { ApiResponse } from '../../types/api';
import { SectorAnalysisData } from '../../types/segment';

export const sectorApi = {
  getSectors: (): Promise<ApiResponse<SectorAnalysisData>> => {
    return apiClient<SectorAnalysisData>(ENDPOINTS.SECTORS);
  },
};
