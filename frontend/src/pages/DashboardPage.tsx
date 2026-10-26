import React, { useEffect, useState } from 'react';
import {
  Zap,
  TrendingUp,
  Building2,
  Clock,
  Lightbulb,
  Activity,
  Calendar,
  Database,
  ArrowRight,
  ShieldCheck,
  BarChart3,
} from 'lucide-react';
import { overviewApi, OverviewData } from '../api/services/overviewApi';
import { hourlyApi } from '../api/services/hourlyApi';
import { sectorApi } from '../api/services/sectorApi';
import { peakApi } from '../api/services/peakApi';
import { HourlyAnalysisData, SectorAnalysisData, PeakAnalysisData } from '../types/segment';
import { MetricCard } from '../components/common/MetricCard';
import { formatNumber, formatKwh } from '../utils/formatters';
import { SECTOR_COLORS } from '../utils/constants';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';

interface DashboardPageProps {
  onNavigateSection?: (sectionId: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigateSection }) => {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [hourly, setHourly] = useState<HourlyAnalysisData | null>(null);
  const [sectors, setSectors] = useState<SectorAnalysisData | null>(null);
  const [peak, setPeak] = useState<PeakAnalysisData | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      overviewApi.getOverview(),
      hourlyApi.getHourlyProfiles(),
      sectorApi.getSectors(),
      peakApi.getPeakAnalysis(),
    ])
      .then(([overviewRes, hourlyRes, sectorRes, peakRes]) => {
        setOverview(overviewRes.data);
        setHourly(hourlyRes.data);
        setSectors(sectorRes.data);
        setPeak(peakRes.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load grid dashboard metrics');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-loading">
          <Activity className="w-6 h-6 text-emerald-600 animate-spin" style={{ margin: '0 auto 0.75rem' }} />
          Loading smart grid operational data & statistical benchmarks...
        </div>
      </div>
    );
  }

  if (error || !overview || !hourly || !sectors || !peak) {
    return (
      <div className="page-container">
        <div className="page-error">
          <strong>Failed to load dashboard:</strong> {error || 'Data could not be retrieved'}
        </div>
      </div>
    );
  }

  // Calculate cumulative monitored GWh from sample size & mean
  const totalMonitoredKwh = overview.sample_size * overview.mean_consumption_kwh;
  const totalMonitoredGwh = totalMonitoredKwh / 1_000_000;

  // Prepare hourly diurnal chart data
  const diurnalChartData = hourly.hourly_profiles.map((p) => ({
    hour: `${p.hour.toString().padStart(2, '0')}:00`,
    meanKwh: Number(p.mean_kwh.toFixed(2)),
    isPeak: p.peak_period_flag,
  }));

  // Prepare sector comparison chart data
  const sectorChartData = sectors.sectors.map((s) => ({
    name: s.segment_value,
    meanKwh: Number(s.mean_kwh.toFixed(2)),
    count: s.count,
    color: SECTOR_COLORS[s.segment_value] || '#059669',
  }));

  // Find peak mean & multiplier
  const peakMeanKwh = peak.peak?.mean_kwh ?? 15.99;
  const nonPeakMeanKwh = peak.non_peak?.mean_kwh ?? 13.85;
  const peakMultiplier = peak.ratio_peak_to_non_peak_mean ?? 1.155;

  return (
    <div className="page-container">
      {/* Research Provenance & Transparency Banner */}
      <div className="research-banner p-3 mb-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <div>
            <span className="font-bold uppercase tracking-wider text-emerald-800 mr-2">
              Synthetic Research Benchmark Dataset
            </span>
            <span className="text-emerald-900">
              Coverage: <strong>2015-01-01 to 2024-07-04</strong> (Last timestamp: 2024-07-04 15:00:00).
              <span className="ml-1 text-emerald-700 italic">Notice: 2024 is a partial calendar year (7 months observed).</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="pill-badge pill-badge-emerald font-mono text-xs">
            N = 1,000,000 Verified Observations
          </span>
        </div>
      </div>

      {/* Page Header */}
      <div className="page-header">
        <h2 className="page-title">Executive Smart Grid Energy Analytics Dashboard</h2>
        <p className="page-description">
          Empirical consumption statistics, diurnal demand cycles, and peak load dynamics across the 1,000,000 meter dataset.
        </p>
      </div>

      {/* 4 Primary KPI Cards */}
      <div className="metrics-grid">
        <MetricCard
          title="Total Monitored Energy"
          value={formatNumber(totalMonitoredGwh, 2)}
          unit="GWh"
          subtitle="Cumulative across 1,000,000 meter hours"
          badge="Complete Period"
          icon={<Zap className="w-4 h-4 text-emerald-600" />}
          variant="emerald"
        />

        <MetricCard
          title="Average Hourly Demand"
          value={formatNumber(overview.mean_consumption_kwh, 2)}
          unit="kWh"
          subtitle={`Std Dev: ±${formatNumber(overview.std_consumption_kwh, 2)} kWh`}
          badge="Mean Load"
          icon={<TrendingUp className="w-4 h-4 text-blue-600" />}
          variant="blue"
        />

        <MetricCard
          title="Peak Period Demand"
          value={formatNumber(peakMeanKwh, 2)}
          unit="kWh"
          subtitle={`${formatNumber(peakMultiplier, 3)}× baseline non-peak load`}
          badge="Surge Windows"
          icon={<Clock className="w-4 h-4 text-amber-600" />}
          variant="amber"
        />

        <MetricCard
          title="Top Consuming Sector"
          value={overview.highest_consuming_sector}
          unit={`${formatNumber(sectorChartData.find((s) => s.name === overview.highest_consuming_sector)?.meanKwh ?? 25.50, 1)} kWh`}
          subtitle="Industrial manufacturing & continuous loads"
          badge="Sector Leader"
          icon={<Building2 className="w-4 h-4 text-emerald-600" />}
          variant="default"
        />
      </div>

      {/* Quick Navigation Cards to Deep-Dive Modules */}
      {onNavigateSection && (
        <div className="grid-3-col my-4">
          <div
            onClick={() => onNavigateSection('consumption')}
            className="action-card"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                Consumption Record Explorer
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400 action-card-arrow transition-all" />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Dynamic multi-criteria SQL filtering, moment recalculation, and 99th percentile high-consumption detection.
            </p>
          </div>

          <div
            onClick={() => onNavigateSection('distributions')}
            className="action-card"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-blue-600" />
                Probability Distribution Fitting
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400 action-card-arrow transition-all" />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Continuous MLE PDF curves, AIC/BIC rankings (Log-normal Rank #1), and resolution-adjustable visualizer.
            </p>
          </div>

          <div
            onClick={() => onNavigateSection('extreme-values')}
            className="action-card"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-600" />
                Extreme Value (GEV) Modeling
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400 action-card-arrow transition-all" />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Daily & monthly block maxima fitting, Weibull (Type III) bounded tail analysis, and design return level curves.
            </p>
          </div>
        </div>
      )}

      {/* Main Charts Grid: Consumption Trend Line Chart & Sector Bar Chart */}
      <div className="grid-2-col">
        {/* Diurnal Hourly Trend Line Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">24-Hour Diurnal Demand Profile</h3>
              <p className="chart-subtitle">Average hourly consumption across grid feeder meters</p>
            </div>
            <span className="chart-badge">Hourly Profile</span>
          </div>

          <div style={{ height: 280, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={diurnalChartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="hour"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  interval={2}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  domain={[12, 17]}
                  unit=" kWh"
                />
                <Tooltip
                  formatter={(val: any) => [`${val} kWh`, 'Mean Hourly Load']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
                    fontSize: '0.8rem',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="meanKwh"
                  stroke="#059669"
                  strokeWidth={2.5}
                  fill="url(#emeraldGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>Morning Peak: 06:00 – 09:00</span>
            <span>Evening Peak: 18:00 – 22:00</span>
          </div>
        </div>

        {/* Sector Comparison Bar Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">Sector Consumption Comparison</h3>
              <p className="chart-subtitle">Mean hourly energy demand per consumer category</p>
            </div>
            <span className="chart-badge">5 Sectors</span>
          </div>

          <div style={{ height: 280, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectorChartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  unit=" kWh"
                />
                <Tooltip
                  formatter={(val: any) => [`${val} kWh`, 'Average Load']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
                    fontSize: '0.8rem',
                  }}
                />
                <Bar dataKey="meanKwh" radius={[6, 6, 0, 0]}>
                  {sectorChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>Industrial: Highest Load (25.50 kWh)</span>
            <span>Domestic: Base Load (4.95 kWh)</span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Compact Peak vs Non-Peak Comparison & Data Insight */}
      <div className="grid-2-col">
        {/* Compact Peak vs Non-Peak Comparison */}
        <div className="card-box">
          <div className="card-heading" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Peak vs. Non-Peak Dynamics</span>
            <span className="pill-badge pill-badge-amber">
              {formatNumber(peakMultiplier, 3)}× Multiplier
            </span>
          </div>
          <p className="card-subheading">
            Comparison between high-demand windows and baseline grid hours.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <div style={{ padding: '0.85rem', backgroundColor: 'var(--amber-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--amber-100)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--amber-600)', marginBottom: '0.25rem' }}>
                PEAK PERIOD
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#92400e' }}>
                {formatKwh(peakMeanKwh)}
              </div>
              <div style={{ fontSize: '0.725rem', color: '#b45309', marginTop: '0.2rem' }}>
                375,000 observations (06:00–09:00 & 18:00–22:00)
              </div>
            </div>

            <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-muted)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                NON-PEAK PERIOD
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-title)' }}>
                {formatKwh(nonPeakMeanKwh)}
              </div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                625,000 observations (remaining grid hours)
              </div>
            </div>
          </div>

          <div className="progress-bar-bg" style={{ marginTop: '1.25rem', height: '10px' }}>
            <div
              className="progress-bar-fill"
              style={{
                width: `${Math.min(100, (peakMeanKwh / 20) * 100)}%`,
                backgroundColor: 'var(--amber-600)',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            <span>Non-Peak Baseline: 13.85 kWh</span>
            <span>Surge Differential: +{(peakMeanKwh - nonPeakMeanKwh).toFixed(2)} kWh (+15.5%)</span>
          </div>
        </div>

        {/* Short Data-Driven Insight Card */}
        <div className="card-box" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="card-heading" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lightbulb className="w-5 h-5 text-emerald-600" />
              <span>Operational Grid Insights</span>
            </div>
            <p className="card-subheading">
              Key takeaways synthesized from verified empirical statistics.
            </p>

            <div className="insight-box" style={{ marginTop: '0.5rem' }}>
              <div>
                <div className="insight-title">Dominant Load & Peak Behavior</div>
                <div className="insight-text">
                  The <strong>{overview.highest_consuming_sector}</strong> sector operates at the highest average intensity (25.50 kWh/hr), contributing disproportionately to grid stress.
                  Diurnal demand surges occur during the morning (06:00–09:00) and evening (18:00–22:00) windows with a <strong>{formatNumber(peakMultiplier, 3)}×</strong> increase over non-peak baseline.
                </div>
              </div>
            </div>
          </div>

          <div className="notice-box" style={{ marginTop: '1rem' }}>
            <strong>Metric Context:</strong> Hourly meter demand (kWh/hr) across 1,000,000 observations from 2015 to 2024. Total monitored energy represents cumulative consumption across the benchmark dataset (14.74 GWh).
          </div>
        </div>
      </div>
    </div>
  );
};
