export interface DescriptiveStatistics {
  scope: string;
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

export interface DistributionFit {
  distribution: string;
  param_shape?: number | null;
  param_loc: number;
  param_scale: number;
  aic: number;
  bic: number;
  ks_statistic: number;
  ks_pvalue: number;
  ad_statistic: number;
  rank: number;
  parameters_json?: Record<string, number> | null;
}

export interface CurvePoint {
  x: number;
  empirical_density?: number | null;
  normal_pdf?: number | null;
  lognormal_pdf?: number | null;
  gamma_pdf?: number | null;
  weibull_pdf?: number | null;
}

export interface DistributionComparisonData {
  descriptive_statistics: DescriptiveStatistics;
  distribution_fits: DistributionFit[];
  best_distribution: string;
  selection_rationale: string;
}
