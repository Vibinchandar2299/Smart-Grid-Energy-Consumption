/**
 * Centralized API endpoint routes
 */
export const ENDPOINTS = {
  OVERVIEW: '/overview',
  DISTRIBUTIONS: {
    COMPARE: '/distributions/compare',
    CURVES: '/distributions/curves',
  },
  SECTORS: '/sectors',
  PEAK: '/peak',
  SEASONAL: '/seasonal',
  HOURLY: '/hourly',
  TEMPORAL_SHIFT: '/temporal-shift',
  EXTREME_VALUES: '/extreme-values',
} as const;
