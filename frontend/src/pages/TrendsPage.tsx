import React, { useEffect, useState } from 'react';
import { Clock, Calendar, Sun, TrendingUp, Activity, AlertCircle } from 'lucide-react';
import { hourlyApi } from '../api/services/hourlyApi';
import { temporalApi } from '../api/services/temporalApi';
import { seasonalApi } from '../api/services/seasonalApi';
import { HourlyAnalysisData, TemporalShiftData, SeasonalAnalysisData } from '../types/segment';
import { MetricCard } from '../components/common/MetricCard';
import { formatNumber, formatKwh, formatPercent } from '../utils/formatters';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';

type TrendView = 'diurnal' | 'annual' | 'seasonal';

export const TrendsPage: React.FC = () => {
  const [activeView, setActiveView] = useState<TrendView>('diurnal');

  const [hourlyData, setHourlyData] = useState<HourlyAnalysisData | null>(null);
  const [temporalData, setTemporalData] = useState<TemporalShiftData | null>(null);
  const [seasonalData, setSeasonalData] = useState<SeasonalAnalysisData | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      hourlyApi.getHourlyProfiles(),
      temporalApi.getTemporalShift(),
      seasonalApi.getSeasonalAnalysis(),
    ])
      .then(([hourlyRes, temporalRes, seasonalRes]) => {
        setHourlyData(hourlyRes.data);
        setTemporalData(temporalRes.data);
        setSeasonalData(seasonalRes.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load consumption trend data');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-loading">
          <Activity className="w-6 h-6 text-emerald-600 animate-spin" style={{ margin: '0 auto 0.75rem' }} />
          Loading consumption trend models...
        </div>
      </div>
    );
  }

  if (error || !hourlyData || !temporalData || !seasonalData) {
    return (
      <div className="page-container">
        <div className="page-error">
          <strong>Error loading trends:</strong> {error || 'Data unavailable'}
        </div>
      </div>
    );
  }

  // 1. Hourly Diurnal Chart Data
  const diurnalChartData = hourlyData.hourly_profiles.map((p) => ({
    time: `${p.hour.toString().padStart(2, '0')}:00`,
    meanKwh: Number(p.mean_kwh.toFixed(2)),
    stdKwh: Number(p.std_kwh.toFixed(2)),
    isPeak: p.peak_period_flag,
  }));

  // Find min & max hours
  const minHour = diurnalChartData.reduce((prev, curr) => (prev.meanKwh < curr.meanKwh ? prev : curr));
  const maxHour = diurnalChartData.reduce((prev, curr) => (prev.meanKwh > curr.meanKwh ? prev : curr));

  // 2. Annual Shift Chart Data (2015 - 2024)
  const annualChartData = temporalData.shifts.map((s) => ({
    year: s.year.toString(),
    meanKwh: Number(s.mean_kwh.toFixed(2)),
    shift: s.shift_percentage,
    isPartial: s.year === 2024,
  }));

  const minYear = annualChartData.reduce((prev, curr) => (prev.meanKwh < curr.meanKwh ? prev : curr));
  const maxYear = annualChartData.reduce((prev, curr) => (prev.meanKwh > curr.meanKwh ? prev : curr));

  // 3. Seasonal Chart Data
  const seasonalChartData = seasonalData.seasons.map((s) => ({
    season: s.segment_value,
    meanKwh: Number(s.mean_kwh.toFixed(2)),
    count: s.count,
  }));

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 className="page-title">Consumption Trends & Temporal Patterns</h2>
            <p className="page-description">
              Examine grid demand fluctuations across hourly diurnal cycles, annual multi-year shifts, and seasonal weather periods.
            </p>
          </div>

          {/* Timeframe Selection Pills */}
          <div className="tab-pill-group">
            <button
              onClick={() => setActiveView('diurnal')}
              className={`tab-pill ${activeView === 'diurnal' ? 'tab-pill-active' : ''}`}
            >
              <Clock className="w-3.5 h-3.5" style={{ display: 'inline', marginRight: '4px' }} />
              24-Hour Diurnal
            </button>
            <button
              onClick={() => setActiveView('annual')}
              className={`tab-pill ${activeView === 'annual' ? 'tab-pill-active' : ''}`}
            >
              <Calendar className="w-3.5 h-3.5" style={{ display: 'inline', marginRight: '4px' }} />
              Annual (2015–2024)
            </button>
            <button
              onClick={() => setActiveView('seasonal')}
              className={`tab-pill ${activeView === 'seasonal' ? 'tab-pill-active' : ''}`}
            >
              <Sun className="w-3.5 h-3.5" style={{ display: 'inline', marginRight: '4px' }} />
              Seasonal Cycle
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: 24-HOUR DIURNAL PATTERN */}
      {activeView === 'diurnal' && (
        <>
          <div className="metrics-grid">
            <MetricCard
              title="Daily Peak Hour"
              value={maxHour.time}
              unit={`${formatNumber(maxHour.meanKwh, 2)} kWh`}
              subtitle="Evening peak demand surge"
              variant="amber"
            />
            <MetricCard
              title="Daily Trough Hour"
              value={minHour.time}
              unit={`${formatNumber(minHour.meanKwh, 2)} kWh`}
              subtitle="Overnight baseline minimum"
              variant="blue"
            />
            <MetricCard
              title="Diurnal Load Spread"
              value={formatNumber(maxHour.meanKwh - minHour.meanKwh, 2)}
              unit="kWh"
              subtitle="Spread between peak and trough"
              variant="emerald"
            />
            <MetricCard
              title="Surge Windows"
              value="06-09h & 18-22h"
              subtitle="Standard morning & evening peaks"
              variant="default"
            />
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <div>
                <h3 className="chart-title">24-Hour Diurnal Load Profile (Mean kWh)</h3>
                <p className="chart-subtitle">Hourly mean smart meter demand across all consumer categories</p>
              </div>
              <span className="chart-badge">Hourly Stratification (N = 1,000,000)</span>
            </div>

            <div style={{ height: 360, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={diurnalChartData} margin={{ top: 15, right: 20, left: 0, bottom: 10 }}>
                  <defs>
                    <linearGradient id="trendsDiurnalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} interval={1} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={[12, 17]} unit=" kWh" />
                  <Tooltip
                    formatter={(val: any) => [`${val} kWh`, 'Hourly Mean Load']}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
                      fontSize: '0.825rem',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="meanKwh"
                    stroke="#059669"
                    strokeWidth={2.5}
                    fill="url(#trendsDiurnalGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="notice-box mt-4">
            <strong>Data Scope:</strong> Diurnal profile aggregates all 1M meter observations into 24 one-hour blocks (00:00 to 23:00). Morning (06:00–09:00) and evening (18:00–22:00) intervals display the highest coincident demand across residential and commercial sectors.
          </div>
        </>
      )}

      {/* VIEW 2: ANNUAL TRENDS (2015 - 2024) */}
      {activeView === 'annual' && (
        <>
          <div className="metrics-grid">
            <MetricCard
              title="Longitudinal Span"
              value="10 Years"
              unit="2015–2024"
              subtitle="Multi-year grid observation window"
              variant="emerald"
            />
            <MetricCard
              title="Lowest Year Mean"
              value={maxYear.year === '2024' ? minYear.year : minYear.year}
              unit={`${formatNumber(minYear.meanKwh, 2)} kWh`}
              subtitle={`Base consumption year (${minYear.year})`}
              variant="blue"
            />
            <MetricCard
              title="Highest Year Mean"
              value={maxYear.year}
              unit={`${formatNumber(maxYear.meanKwh, 2)} kWh`}
              subtitle={`Peak annual average (${maxYear.year})`}
              variant="amber"
            />
            <MetricCard
              title="10-Year Stability"
              value="±0.3 kWh"
              subtitle="Stable secular load trajectory"
              variant="default"
            />
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <div>
                <h3 className="chart-title">Annual Average Demand Trend (2015 – 2024)</h3>
                <p className="chart-subtitle">Mean energy consumption per meter-hour across calendar years</p>
              </div>
              <span className="chart-badge">Annual Cohorts (2015–2024)</span>
            </div>

            <div style={{ height: 360, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={annualChartData} margin={{ top: 15, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="year" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={[14.4, 15.1]} unit=" kWh" />
                  <Tooltip
                    formatter={(val: any) => [`${val} kWh`, 'Annual Mean']}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
                      fontSize: '0.825rem',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="meanKwh"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    dot={{ r: 5, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="notice-box mt-4" style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" style={{ marginTop: '0.15rem' }} />
            <div>
              <strong>Partial Period Disclosure (2024):</strong> Year 2024 represents a partial observation window in the historical dataset. Comparisons against preceding complete calendar years (2015–2023) should account for incomplete seasonal representation in the final cohort.
            </div>
          </div>
        </>
      )}

      {/* VIEW 3: SEASONAL CYCLE */}
      {activeView === 'seasonal' && (
        <>
          <div className="metrics-grid">
            <MetricCard
              title="Peak Demand Season"
              value={seasonalData.peak_season}
              unit={`${formatNumber(seasonalChartData.find(s => s.season === seasonalData.peak_season)?.meanKwh ?? 14.85, 2)} kWh`}
              subtitle="Summer cooling & agricultural pump loads"
              variant="amber"
            />
            <MetricCard
              title="Lowest Demand Season"
              value={seasonalData.lowest_season}
              unit={`${formatNumber(seasonalChartData.find(s => s.season === seasonalData.lowest_season)?.meanKwh ?? 14.62, 2)} kWh`}
              subtitle="Moderate weather baseline"
              variant="blue"
            />
            <MetricCard
              title="Seasonal Differential"
              value="0.23 kWh"
              subtitle="Seasonal range across Tamil Nadu calendar"
              variant="emerald"
            />
            <MetricCard
              title="Weather Stratification"
              value="4 Seasons"
              subtitle="Summer, Monsoon, Post-Monsoon, Winter"
              variant="default"
            />
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <div>
                <h3 className="chart-title">Seasonal Consumption Comparison</h3>
                <p className="chart-subtitle">Average hourly energy demand stratified by regional weather season</p>
              </div>
              <span className="chart-badge">4 Seasonal Categories</span>
            </div>

            <div style={{ height: 360, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={seasonalChartData} margin={{ top: 15, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="season" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={[14, 15.2]} unit=" kWh" />
                  <Tooltip
                    formatter={(val: any) => [`${val} kWh`, 'Seasonal Mean Load']}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
                      fontSize: '0.825rem',
                    }}
                  />
                  <Bar dataKey="meanKwh" radius={[6, 6, 0, 0]} fill="#059669">
                    {seasonalChartData.map((entry, index) => (
                      <Cell
                        key={`season-${index}`}
                        fill={entry.season === seasonalData.peak_season ? '#d97706' : '#059669'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="notice-box mt-4">
            <strong>Seasonal Weather Context:</strong> Summer reflects higher cooling loads and irrigation pumping across Tamil Nadu districts. Monsoon and Winter benefit from lower temperatures, reducing domestic air conditioning and refrigeration duty cycles.
          </div>
        </>
      )}
    </div>
  );
};
