/**
 * Centralized API endpoint routes
 */
export const ENDPOINTS = {
  OVERVIEW: '/overview',
  CONSUMPTION: {
    OPTIONS: '/consumption/options',
    FILTER: '/consumption/filter',
    HIGH_CONSUMPTION: '/consumption/high-consumption',
    EXPORT_CSV: '/consumption/export-csv',
  },
  DISTRIBUTIONS: {
    COMPARE: '/distributions/compare',
    CURVES: '/distributions/curves',
    EXPORT_CSV: '/distributions/export-csv',
  },
  SECTORS: '/sectors',
  PEAK: '/peak',
  SEASONAL: '/seasonal',
  HOURLY: '/hourly',
  TEMPORAL_SHIFT: '/temporal-shift',
  EXTREME_VALUES: {
    BASE: '/extreme-values',
    EXPORT_CSV: '/extreme-values/export-csv',
  },
} as const;
