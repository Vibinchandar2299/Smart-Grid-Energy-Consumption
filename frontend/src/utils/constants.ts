export const APP_TITLE = 'Smart Grid Energy Dashboard';
export const APP_SUBTITLE = 'Operational Energy Consumption Monitoring & Grid Load Intelligence';
export const RESEARCH_TITLE = 'Smart Grid Energy Consumption Analysis';

export const PRIMARY_METRIC = 'energy_consumption_kwh';

export const SECTOR_COLORS: Record<string, string> = {
  Industrial: '#059669',    // Emerald deep
  Commercial: '#2563eb',    // Royal blue
  Agriculture: '#d97706',   // Amber
  Domestic: '#0284c7',      // Sky blue
  Miscellaneous: '#64748b', // Slate
};

export const DISTRIBUTION_COLORS: Record<string, string> = {
  empirical: '#059669',
  t: '#2563eb',
  genextreme: '#d97706',
  logistic: '#0284c7',
  norm: '#64748b',
};

export const NAVIGATION_SECTIONS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', desc: 'Executive KPI metrics & overview' },
  { id: 'trends', label: 'Consumption Trends', icon: 'TrendingUp', desc: 'Hourly, annual & seasonal patterns' },
  { id: 'sectors', label: 'Sector Analysis', icon: 'Building2', desc: 'Consumer category load breakdown' },
  { id: 'peak', label: 'Peak Demand', icon: 'Zap', desc: 'Peak vs baseline load dynamics' },
] as const;

export type SectionId = (typeof NAVIGATION_SECTIONS)[number]['id'];
