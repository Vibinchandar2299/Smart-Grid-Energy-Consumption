export interface FilterOptionsData {
  sectors: string[];
  years: number[];
  seasons: string[];
  hour_bands: string[];
  peak_options: { label: string; value: number | null }[];
  dataset_info: {
    coverage_start: string;
    coverage_end: string;
    total_observations: number;
    partial_year_warning: string;
  };
}

export interface ConsumptionFilters {
  sector?: string;
  year?: number;
  month?: number;
  season?: string;
  hour?: number;
  hour_band?: string;
  peak_period?: number | null;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

export interface FilteredStatistics {
  count: number;
  mean: number;
  std: number;
  variance: number;
  min_val: number;
  q25: number;
  median: number;
  q75: number;
  max_val: number;
  skewness: number;
  kurtosis: number;
}

export interface ConsumptionRecord {
  id: number;
  timestamp: string;
  sector: string;
  district: string;
  year: number;
  month: number;
  season: string;
  hour: number;
  peak_period_flag: number;
  energy_consumption_kwh: number;
}

export interface FilteredHourlyPoint {
  hour: number;
  mean_kwh: number;
  std_kwh: number;
  count: number;
  peak_period_flag: boolean;
}

export interface FilteredSectorItem {
  sector: string;
  mean_kwh: number;
  std_kwh: number;
  median_kwh: number;
  count: number;
  share_percent: number;
}

export interface FilteredConsumptionData {
  filtered_statistics: FilteredStatistics;
  sample_size: number;
  records: ConsumptionRecord[];
  records_count: number;
  pagination: {
    limit: number;
    offset: number;
    total_matching: number;
  };
  hourly_pattern: FilteredHourlyPoint[];
  sector_distribution: FilteredSectorItem[];
  filters_applied: Record<string, any>;
  is_empty: boolean;
}

export interface HighConsumptionFlaggedRecord {
  id: number;
  timestamp: string;
  sector: string;
  district: string;
  hour: number;
  peak_period_flag: number;
  energy_consumption_kwh: number;
  exceedance_delta_kwh: number;
}

export interface HighConsumptionData {
  selected_percentile: number;
  calculated_threshold_kwh: number;
  total_reference_count: number;
  exceedance_count: number;
  exceedance_percentage: number;
  flagged_records: HighConsumptionFlaggedRecord[];
  scientific_disclaimer: string;
}
