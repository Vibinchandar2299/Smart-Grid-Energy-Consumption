export const RESEARCH_TITLE =
  'Statistical Modeling of Smart Grid Energy Consumption Patterns Using Probability Distribution Metrics';

export const PRIMARY_METRIC = 'energy_consumption_kwh';

export const DISTRIBUTION_COLORS: Record<string, string> = {
  Gamma: '#06b6d4',      // Cyan
  'Log-normal': '#8b5cf6', // Violet
  Weibull: '#f59e0b',    // Amber
  Normal: '#ec4899',     // Pink
  Empirical: '#94a3b8',  // Slate
};

export const SECTOR_COLORS: Record<string, string> = {
  Residential: '#3b82f6',
  Commercial: '#10b981',
  Industrial: '#f97316',
  Agricultural: '#8b5cf6',
};

export const NAVIGATION_SECTIONS = [
  { id: 'overview', label: '1. Overview', icon: 'LayoutDashboard' },
  { id: 'distributions', label: '2. Distribution Analysis', icon: 'BarChart3' },
  { id: 'sectors', label: '3. Sector Analysis', icon: 'Building2' },
  { id: 'peak', label: '4. Peak vs Non-Peak', icon: 'Zap' },
  { id: 'seasonal', label: '5. Seasonal Analysis', icon: 'Sun' },
  { id: 'hourly', label: '6. Hourly Analysis', icon: 'Clock' },
  { id: 'temporal-shift', label: '7. Temporal Shift', icon: 'TrendingUp' },
  { id: 'extreme-values', label: '8. Extreme Value Analysis', icon: 'AlertTriangle' },
] as const;

export type SectionId = (typeof NAVIGATION_SECTIONS)[number]['id'];
