import { apiClient } from '../client';
import { ENDPOINTS } from '../endpoints';
import { ApiResponse } from '../../types/api';
import {
  FilterOptionsData,
  ConsumptionFilters,
  FilteredConsumptionData,
  HighConsumptionData,
} from '../../types/consumption';

export const consumptionApi = {
  getOptions: (): Promise<ApiResponse<FilterOptionsData>> => {
    return apiClient<FilterOptionsData>(ENDPOINTS.CONSUMPTION.OPTIONS);
  },

  getFilteredConsumption: (filters: ConsumptionFilters = {}): Promise<ApiResponse<FilteredConsumptionData>> => {
    const params = new URLSearchParams();
    if (filters.sector && filters.sector !== 'All') params.append('sector', filters.sector);
    if (filters.year) params.append('year', filters.year.toString());
    if (filters.month) params.append('month', filters.month.toString());
    if (filters.season && filters.season !== 'All') params.append('season', filters.season);
    if (filters.hour !== undefined && filters.hour !== null) params.append('hour', filters.hour.toString());
    if (filters.hour_band && filters.hour_band !== 'All') params.append('hour_band', filters.hour_band);
    if (filters.peak_period !== undefined && filters.peak_period !== null) params.append('peak_period', filters.peak_period.toString());
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset !== undefined) params.append('offset', filters.offset.toString());

    const qs = params.toString();
    const url = qs ? `${ENDPOINTS.CONSUMPTION.FILTER}?${qs}` : ENDPOINTS.CONSUMPTION.FILTER;
    return apiClient<FilteredConsumptionData>(url);
  },

  getHighConsumption: (
    percentile: number = 99.0,
    filters: ConsumptionFilters = {},
    limit: number = 50,
    offset: number = 0
  ): Promise<ApiResponse<HighConsumptionData>> => {
    const params = new URLSearchParams();
    params.append('percentile', percentile.toString());
    if (filters.sector && filters.sector !== 'All') params.append('sector', filters.sector);
    if (filters.year) params.append('year', filters.year.toString());
    if (filters.month) params.append('month', filters.month.toString());
    if (filters.season && filters.season !== 'All') params.append('season', filters.season);
    if (filters.hour !== undefined && filters.hour !== null) params.append('hour', filters.hour.toString());
    if (filters.peak_period !== undefined && filters.peak_period !== null) params.append('peak_period', filters.peak_period.toString());
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    return apiClient<HighConsumptionData>(`${ENDPOINTS.CONSUMPTION.HIGH_CONSUMPTION}?${params.toString()}`);
  },

  getExportCsvUrl: (filters: ConsumptionFilters = {}): string => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
    const params = new URLSearchParams();
    if (filters.sector && filters.sector !== 'All') params.append('sector', filters.sector);
    if (filters.year) params.append('year', filters.year.toString());
    if (filters.month) params.append('month', filters.month.toString());
    if (filters.season && filters.season !== 'All') params.append('season', filters.season);
    if (filters.hour !== undefined && filters.hour !== null) params.append('hour', filters.hour.toString());
    if (filters.hour_band && filters.hour_band !== 'All') params.append('hour_band', filters.hour_band);
    if (filters.peak_period !== undefined && filters.peak_period !== null) params.append('peak_period', filters.peak_period.toString());
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    params.append('max_records', '5000');

    return `${baseUrl}${ENDPOINTS.CONSUMPTION.EXPORT_CSV}?${params.toString()}`;
  },
};
