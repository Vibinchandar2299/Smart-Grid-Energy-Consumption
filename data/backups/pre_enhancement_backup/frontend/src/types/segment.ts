export interface SegmentStatistic {
  segment_type: string;
  segment_value: string;
  count: number;
  mean_kwh: number;
  std_kwh: number;
  median_kwh: number;
  min_kwh: number;
  max_kwh: number;
  skewness: number;
  kurtosis: number;
  best_fit_dist: string;
  dist_shape?: number | null;
  dist_loc: number;
  dist_scale: number;
  ks_stat: number;
}

export interface SectorAnalysisData {
  sectors: SegmentStatistic[];
  highest_consuming_sector: string;
  highest_volatility_sector: string;
  statistical_summary: string;
}

export interface PeakAnalysisData {
  peak: SegmentStatistic;
  non_peak: SegmentStatistic;
  ratio_peak_to_non_peak_mean: number;
  statistical_summary: string;
}

export interface SeasonalAnalysisData {
  seasons: SegmentStatistic[];
  peak_season: string;
  lowest_season: string;
  statistical_summary: string;
}

export interface HourlyProfilePoint {
  hour: number;
  mean_kwh: number;
  std_kwh: number;
  median_kwh: number;
  peak_period_flag: boolean;
}

export interface HourlyAnalysisData {
  hourly_profiles: HourlyProfilePoint[];
  peak_hours_range: string;
  statistical_summary: string;
}

export interface TemporalShiftItem {
  year: number;
  mean_kwh: number;
  std_kwh: number;
  median_kwh: number;
  skewness: number;
  kurtosis: number;
  best_fit_dist: string;
  shift_percentage: number;
}

export interface TemporalShiftData {
  shifts: TemporalShiftItem[];
  overall_trend: string;
  statistical_summary: string;
}
