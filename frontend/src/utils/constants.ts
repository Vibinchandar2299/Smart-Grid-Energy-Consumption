export const APP_TITLE = 'Smart Grid Energy Analytics';
export const APP_SUBTITLE = 'Statistical Modeling of Smart Grid Energy Consumption Patterns';
export const RESEARCH_TITLE = 'Statistical Modeling of Smart Grid Energy Consumption Patterns Using Probability Distribution Metrics';

export const PRIMARY_METRIC = 'energy_consumption_kwh';

export const SECTOR_COLORS: Record<string, string> = {
  Industrial: '#059669',    // Emerald deep
  Commercial: '#2563eb',    // Royal blue
  Agriculture: '#d97706',   // Amber
  Domestic: '#0284c7',      // Sky blue
  Miscellaneous: '#64748b', // Slate
};

export const DISTRIBUTION_COLORS: Record<string, string> = {
  'Log-normal': '#2563eb',  // Royal blue (Rank #1)
  'Weibull': '#d97706',     // Amber (Rank #2)
  'Normal': '#64748b',      // Slate (Rank #3)
  'Gamma': '#059669',       // Emerald (Rank #4)
};

export const NAVIGATION_SECTIONS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', desc: 'Executive KPI metrics, summary distributions & coverage' },
  { id: 'consumption', label: 'Consumption Analysis', icon: 'BarChart3', desc: 'Dynamic filtering, temporal trends, sector breakdown & peak detection' },
  { id: 'distributions', label: 'Distribution Analysis', icon: 'Activity', desc: 'Probability distribution fitting, AIC/BIC rankings & continuous density curves' },
  { id: 'extreme-values', label: 'Extreme-Value Analysis', icon: 'Zap', desc: 'Generalized Extreme Value (GEV) block maxima & return level modeling' },
] as const;

export type SectionId = (typeof NAVIGATION_SECTIONS)[number]['id'];
