export interface ExtremeValueItem {
  block_type: string;
  sample_maxima_count: number;
  shape_xi: number;
  loc_mu: number;
  scale_sigma: number;
  return_period_days?: number | null;
  return_period_years?: number | null;
  return_level_kwh: number;
  ci_lower_95?: number | null;
  ci_upper_95?: number | null;
  reciprocal_rate?: number | null;
  daily_exceedance_rate?: number | null;
}

export interface GevParameters {
  shape_xi: number;
  loc_mu: number;
  scale_sigma: number;
  domain_type: string;
}

export interface ExtremeValueAnalysisData {
  block_type: string;
  gev_parameters: GevParameters;
  return_levels: ExtremeValueItem[];
  statistical_summary: string;
}
