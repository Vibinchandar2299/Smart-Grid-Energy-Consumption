import React, { useEffect, useState } from 'react';
import {
  Filter,
  RefreshCw,
  Download,
  AlertTriangle,
  Zap,
  Clock,
  Layers,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  Table as TableIcon,
} from 'lucide-react';
import { consumptionApi } from '../api/services/consumptionApi';
import {
  FilterOptionsData,
  ConsumptionFilters,
  FilteredConsumptionData,
  HighConsumptionData,
} from '../types/consumption';
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

export const ConsumptionAnalysisPage: React.FC = () => {
  // Options loaded from backend
  const [options, setOptions] = useState<FilterOptionsData | null>(null);

  // Form input state
  const [sectorInput, setSectorInput] = useState<string>('All');
  const [yearInput, setYearInput] = useState<string>('All');
  const [seasonInput, setSeasonInput] = useState<string>('All');
  const [hourBandInput, setHourBandInput] = useState<string>('All');
  const [peakInput, setPeakInput] = useState<string>('All');
  const [startDateInput, setStartDateInput] = useState<string>('');
  const [endDateInput, setEndDateInput] = useState<string>('');

  // Active filters applied to server query
  const [appliedFilters, setAppliedFilters] = useState<ConsumptionFilters>({
    limit: 25,
    offset: 0,
  });

  // Query response state
  const [consumptionData, setConsumptionData] = useState<FilteredConsumptionData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Sub-tab navigation
  const [activeTab, setActiveTab] = useState<'diurnal' | 'sectors' | 'high-consumption' | 'records'>('diurnal');

  // High-consumption percentile state
  const [percentile, setPercentile] = useState<number>(99.0);
  const [highConsumptionData, setHighConsumptionData] = useState<HighConsumptionData | null>(null);
  const [loadingHighConsumption, setLoadingHighConsumption] = useState<boolean>(false);

  // Load options on initial mount
  useEffect(() => {
    consumptionApi
      .getOptions()
      .then((res) => {
        setOptions(res.data);
      })
      .catch((err) => {
        console.error('Failed to load filter options:', err);
      });
  }, []);

  // Fetch filtered consumption data whenever appliedFilters changes
  useEffect(() => {
    setLoading(true);
    setError(null);
    consumptionApi
      .getFilteredConsumption(appliedFilters)
      .then((res) => {
        setConsumptionData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to query consumption data');
        setLoading(false);
      });
  }, [appliedFilters]);

  // Fetch high-consumption detection whenever appliedFilters or percentile changes
  useEffect(() => {
    if (activeTab === 'high-consumption') {
      setLoadingHighConsumption(true);
      consumptionApi
        .getHighConsumption(percentile, appliedFilters, 50, 0)
        .then((res) => {
          setHighConsumptionData(res.data);
          setLoadingHighConsumption(false);
        })
        .catch((err) => {
          console.error('High consumption detection error:', err);
          setLoadingHighConsumption(false);
        });
    }
  }, [appliedFilters, percentile, activeTab]);

  const handleApplyFilters = () => {
    const newFilters: ConsumptionFilters = {
      limit: 25,
      offset: 0,
    };
    if (sectorInput !== 'All') newFilters.sector = sectorInput;
    if (yearInput !== 'All') newFilters.year = parseInt(yearInput, 10);
    if (seasonInput !== 'All') newFilters.season = seasonInput;
    if (hourBandInput !== 'All') newFilters.hour_band = hourBandInput;
    if (peakInput === '1') newFilters.peak_period = 1;
    if (peakInput === '0') newFilters.peak_period = 0;
    if (startDateInput) newFilters.start_date = startDateInput;
    if (endDateInput) newFilters.end_date = endDateInput;

    setAppliedFilters(newFilters);
  };

  const handleResetFilters = () => {
    setSectorInput('All');
    setYearInput('All');
    setSeasonInput('All');
    setHourBandInput('All');
    setPeakInput('All');
    setStartDateInput('');
    setEndDateInput('');
    setAppliedFilters({ limit: 25, offset: 0 });
  };

  const handlePageChange = (newOffset: number) => {
    setAppliedFilters((prev) => ({
      ...prev,
      offset: Math.max(0, newOffset),
    }));
  };

  const stats = consumptionData?.filtered_statistics;
  const sampleSize = consumptionData?.sample_size ?? 0;
  const isFiltered = Object.keys(appliedFilters).some(
    (k) => k !== 'limit' && k !== 'offset' && appliedFilters[k as keyof ConsumptionFilters] !== undefined
  );

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="header-split">
          <div>
            <h2 className="page-title">Genuine Consumption Record Explorer</h2>
            <p className="page-description">
              Direct SQL-indexed filtering, moment recalculation, and diurnal profile analysis across the 1,000,000 smart meter records.
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href={consumptionApi.getExportCsvUrl(appliedFilters)}
              download
              className="export-btn flex items-center gap-1.5"
              title="Download currently filtered records as RFC-compliant CSV"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </a>
          </div>
        </div>
      </div>

      {/* Interactive Filter Panel */}
      <div className="filter-card">
        <div className="filter-card-header">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-slate-800 text-sm">Interactive Cohort Filter</span>
          </div>
          <div className="text-xs text-slate-500">
            {options?.dataset_info ? (
              <span>Coverage: {options.dataset_info.coverage_start} to {options.dataset_info.coverage_end} (Total: {formatNumber(options.dataset_info.total_observations)} records)</span>
            ) : (
              <span>1,000,000 Records Available</span>
            )}
          </div>
        </div>

        <div className="filter-grid">
          {/* Sector */}
          <div className="filter-group">
            <label className="filter-label">Sector</label>
            <select
              className="filter-select"
              value={sectorInput}
              onChange={(e) => setSectorInput(e.target.value)}
            >
              <option value="All">All Sectors (5)</option>
              {options?.sectors.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div className="filter-group">
            <label className="filter-label">Year</label>
            <select
              className="filter-select"
              value={yearInput}
              onChange={(e) => setYearInput(e.target.value)}
            >
              <option value="All">All Years (2015–2024)</option>
              {options?.years.map((y) => (
                <option key={y} value={y.toString()}>
                  {y} {y === 2024 ? '(Partial - Jul)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Season */}
          <div className="filter-group">
            <label className="filter-label">Season</label>
            <select
              className="filter-select"
              value={seasonInput}
              onChange={(e) => setSeasonInput(e.target.value)}
            >
              <option value="All">All Seasons</option>
              {options?.seasons.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Hour Band */}
          <div className="filter-group">
            <label className="filter-label">Hour Band</label>
            <select
              className="filter-select"
              value={hourBandInput}
              onChange={(e) => setHourBandInput(e.target.value)}
            >
              <option value="All">All 24 Hours</option>
              <option value="Morning Peak (06-09)">Morning Peak (06:00–09:00)</option>
              <option value="Day Baseline (10-17)">Day Baseline (10:00–17:00)</option>
              <option value="Evening Peak (18-22)">Evening Peak (18:00–22:00)</option>
              <option value="Night Off-Peak (23-05)">Night Off-Peak (23:00–05:00)</option>
            </select>
          </div>

          {/* Peak Period Flag */}
          <div className="filter-group">
            <label className="filter-label">Peak Status</label>
            <select
              className="filter-select"
              value={peakInput}
              onChange={(e) => setPeakInput(e.target.value)}
            >
              <option value="All">Both Peak & Non-Peak</option>
              <option value="1">Peak Windows (06-09, 18-22)</option>
              <option value="0">Non-Peak Windows</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="filter-group">
            <label className="filter-label">Start Date</label>
            <input
              type="date"
              className="filter-select"
              value={startDateInput}
              min="2015-01-01"
              max="2024-07-04"
              onChange={(e) => setStartDateInput(e.target.value)}
            />
          </div>

          {/* End Date */}
          <div className="filter-group">
            <label className="filter-label">End Date</label>
            <input
              type="date"
              className="filter-select"
              value={endDateInput}
              min="2015-01-01"
              max="2024-07-04"
              onChange={(e) => setEndDateInput(e.target.value)}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="filter-actions flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={handleApplyFilters}
              disabled={loading}
              className="btn btn-primary flex items-center gap-1.5"
            >
              <Filter className="w-4 h-4" />
              <span>Apply Filters</span>
            </button>
            <button
              onClick={handleResetFilters}
              disabled={loading}
              className="btn btn-secondary flex items-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          </div>

          {/* Active Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {isFiltered ? (
              <>
                <span className="text-slate-500 font-medium">Active:</span>
                {appliedFilters.sector && <span className="filter-chip">Sector: {appliedFilters.sector}</span>}
                {appliedFilters.year && <span className="filter-chip">Year: {appliedFilters.year}</span>}
                {appliedFilters.season && <span className="filter-chip">Season: {appliedFilters.season}</span>}
                {appliedFilters.hour_band && <span className="filter-chip">{appliedFilters.hour_band}</span>}
                {appliedFilters.peak_period !== undefined && (
                  <span className="filter-chip">
                    {appliedFilters.peak_period === 1 ? 'Peak Period' : 'Non-Peak Period'}
                  </span>
                )}
                {appliedFilters.start_date && <span className="filter-chip">From: {appliedFilters.start_date}</span>}
                {appliedFilters.end_date && <span className="filter-chip">To: {appliedFilters.end_date}</span>}
              </>
            ) : (
              <span className="text-slate-500 italic">Showing entire benchmark cohort (100% of observations)</span>
            )}
          </div>
        </div>
      </div>

      {/* Cohort Verification Banner */}
      <div className="cohort-banner flex items-center justify-between p-3 my-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950 text-xs">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Verified Empirical Cohort:</strong> {formatNumber(sampleSize)} records match current criteria ({((sampleSize / 1_000_000) * 100).toFixed(2)}% of grid dataset).
            Statistics are computed directly via PostgreSQL aggregate functions on demand.
          </span>
        </div>
        <span className="font-mono font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
          N = {formatNumber(sampleSize)}
        </span>
      </div>

      {/* Error state */}
      {error && (
        <div className="page-error my-4 p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-800">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            Query Error
          </div>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {consumptionData?.is_empty && (
        <div className="card-box text-center p-8 my-6">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
          <h3 className="text-base font-semibold text-slate-800">No records match the selected filter combination</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Try broadening your date range, switching the sector, or resetting filters to re-include the baseline data.
          </p>
          <button onClick={handleResetFilters} className="btn btn-secondary mt-4">
            Reset Filters
          </button>
        </div>
      )}

      {/* Statistical Moments Grid (Recalculated dynamically) */}
      {stats && !consumptionData?.is_empty && (
        <div className="metrics-grid">
          <MetricCard
            title="Sample Size (N)"
            value={formatNumber(stats.count)}
            unit="records"
            subtitle={`${((stats.count / 1_000_000) * 100).toFixed(1)}% of grid data`}
            variant="emerald"
            badge={isFiltered ? 'Filtered Subcohort' : 'Entire Dataset'}
          />
          <MetricCard
            title="Mean Consumption"
            value={formatNumber(stats.mean, 2)}
            unit="kWh"
            subtitle={`Std Dev: ±${formatNumber(stats.std, 2)} kWh`}
            variant="blue"
          />
          <MetricCard
            title="Median Consumption"
            value={formatNumber(stats.median, 2)}
            unit="kWh"
            subtitle={`IQR: ${formatNumber(stats.q25, 2)} – ${formatNumber(stats.q75, 2)} kWh`}
            variant="amber"
          />
          <MetricCard
            title="Min / Max Observed"
            value={`${formatNumber(stats.min_val, 1)} – ${formatNumber(stats.max_val, 1)}`}
            unit="kWh"
            subtitle={`Range: ${formatNumber(stats.max_val - stats.min_val, 1)} kWh`}
            variant="purple"
          />
          <MetricCard
            title="Skewness"
            value={formatNumber(stats.skewness, 3)}
            subtitle={stats.skewness > 0 ? 'Right-skewed positive tail' : 'Left-skewed'}
            variant="cyan"
          />
          <MetricCard
            title="Excess Kurtosis"
            value={formatNumber(stats.kurtosis, 3)}
            subtitle={stats.kurtosis > 0 ? 'Leptokurtic (heavy-tailed)' : 'Platykurtic'}
            variant="rose"
          />
        </div>
      )}

      {/* View Sub-Tabs */}
      <div className="subtabs-container mt-6">
        <div className="subtabs-nav flex gap-2 border-b border-slate-200 pb-2">
          <button
            className={`subtab-btn flex items-center gap-1.5 ${activeTab === 'diurnal' ? 'active' : ''}`}
            onClick={() => setActiveTab('diurnal')}
          >
            <Clock className="w-4 h-4" />
            <span>Diurnal Hourly Profile</span>
          </button>
          <button
            className={`subtab-btn flex items-center gap-1.5 ${activeTab === 'sectors' ? 'active' : ''}`}
            onClick={() => setActiveTab('sectors')}
          >
            <Layers className="w-4 h-4" />
            <span>Sector Distribution</span>
          </button>
          <button
            className={`subtab-btn flex items-center gap-1.5 ${activeTab === 'high-consumption' ? 'active' : ''}`}
            onClick={() => setActiveTab('high-consumption')}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>High-Consumption Detection (Percentile)</span>
          </button>
          <button
            className={`subtab-btn flex items-center gap-1.5 ${activeTab === 'records' ? 'active' : ''}`}
            onClick={() => setActiveTab('records')}
          >
            <TableIcon className="w-4 h-4" />
            <span>Raw Records Explorer</span>
          </button>
        </div>

        {/* Tab 1: Diurnal Hourly Profile */}
        {activeTab === 'diurnal' && consumptionData && (
          <div className="chart-card mt-4">
            <div className="chart-header">
              <div>
                <h3 className="chart-title">Diurnal 24-Hour Profile for Filtered Cohort</h3>
                <p className="chart-subtitle">
                  Mean hourly consumption across matching records with morning (06–09) and evening (18–22) peak tracking.
                </p>
              </div>
              <span className="chart-badge">Hourly Aggregation</span>
            </div>

            <div style={{ height: 320, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={consumptionData.hourly_pattern.map((p) => ({
                    hour: `${p.hour.toString().padStart(2, '0')}:00`,
                    meanKwh: Number(p.mean_kwh.toFixed(2)),
                    stdKwh: Number(p.std_kwh.toFixed(2)),
                    count: p.count,
                    isPeak: p.peak_period_flag,
                  }))}
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="cohortGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit=" kWh" />
                  <Tooltip
                    formatter={(val: any) => [`${val} kWh`, 'Mean Hourly Demand']}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="meanKwh"
                    stroke="#0284c7"
                    strokeWidth={2.5}
                    fill="url(#cohortGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between mt-2 text-xs text-slate-500">
              <span>Morning Peak: 06:00 – 09:00</span>
              <span>Evening Peak: 18:00 – 22:00</span>
            </div>
          </div>
        )}

        {/* Tab 2: Sector Breakdown */}
        {activeTab === 'sectors' && consumptionData && (
          <div className="grid-2-col mt-4">
            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <h3 className="chart-title">Sector Comparison within Filtered Subset</h3>
                  <p className="chart-subtitle">Mean energy demand (kWh) per consumer class</p>
                </div>
                <span className="chart-badge">Sector Comparison</span>
              </div>
              <div style={{ height: 300, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={consumptionData.sector_distribution.map((s) => ({
                      name: s.sector,
                      meanKwh: Number(s.mean_kwh.toFixed(2)),
                      count: s.count,
                      color: SECTOR_COLORS[s.sector] || '#059669',
                    }))}
                    margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit=" kWh" />
                    <Tooltip
                      formatter={(val: any) => [`${val} kWh`, 'Mean Load']}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                      }}
                    />
                    <Bar dataKey="meanKwh" radius={[6, 6, 0, 0]}>
                      {consumptionData.sector_distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={SECTOR_COLORS[entry.sector] || '#059669'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card-box">
              <h3 className="card-heading">Sector Cohort Metrics</h3>
              <p className="card-subheading">Breakdown of volume and distribution within current filter</p>
              <table className="data-table mt-3">
                <thead>
                  <tr>
                    <th>Sector</th>
                    <th>Mean Demand</th>
                    <th>Median</th>
                    <th>Sample Count</th>
                    <th>Share %</th>
                  </tr>
                </thead>
                <tbody>
                  {consumptionData.sector_distribution.map((s) => (
                    <tr key={s.sector}>
                      <td>
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full mr-2"
                          style={{ backgroundColor: SECTOR_COLORS[s.sector] || '#64748b' }}
                        />
                        <strong>{s.sector}</strong>
                      </td>
                      <td>{formatKwh(s.mean_kwh)}</td>
                      <td>{formatKwh(s.median_kwh)}</td>
                      <td>{formatNumber(s.count)}</td>
                      <td><span className="font-mono font-medium">{s.share_percent.toFixed(1)}%</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: High-Consumption Percentile Detection */}
        {activeTab === 'high-consumption' && (
          <div className="mt-4">
            {/* Scientific explanation banner */}
            <div className="notice-box p-3 bg-amber-50 border border-amber-200 rounded text-amber-950 text-xs">
              <strong>Statistical High-Consumption Detection Methodology:</strong> High-consumption observations are defined as empirical measurements falling above a user-selected percentile cutoff calculated from the reference population. These records represent statistical tail exceedances within the dataset and do not automatically indicate physical equipment failure, grid faults, or power theft.
            </div>

            {/* Percentile Controls */}
            <div className="card-box mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="card-heading">Statistical Percentile Threshold Selector</h3>
                  <p className="card-subheading">
                    Select a percentile cutoff to identify right-tail exceedance events.
                  </p>
                </div>
                <div className="toggle-group">
                  {[90.0, 95.0, 97.5, 99.0, 99.5, 99.9].map((p) => (
                    <button
                      key={p}
                      className={`toggle-btn ${percentile === p ? 'toggle-active' : ''}`}
                      onClick={() => setPercentile(p)}
                    >
                      {p}th %ile
                    </button>
                  ))}
                </div>
              </div>

              {/* Threshold Display Metrics */}
              {highConsumptionData && (
                <div className="metrics-grid mt-4">
                  <MetricCard
                    title="Selected Percentile"
                    value={`${highConsumptionData.selected_percentile}th`}
                    unit="percentile"
                    subtitle="Right-tail cutoff"
                    variant="cyan"
                  />
                  <MetricCard
                    title="Calculated Cutoff Threshold"
                    value={formatNumber(highConsumptionData.calculated_threshold_kwh, 2)}
                    unit="kWh"
                    subtitle="Empirical percentile cutoff"
                    variant="amber"
                  />
                  <MetricCard
                    title="Flagged Observations"
                    value={formatNumber(highConsumptionData.exceedance_count)}
                    unit="records"
                    subtitle={`${highConsumptionData.exceedance_percentage.toFixed(2)}% of reference cohort`}
                    variant="rose"
                  />
                  <MetricCard
                    title="Reference Population"
                    value={formatNumber(highConsumptionData.total_reference_count)}
                    unit="records"
                    subtitle="Sample used for calculation"
                    variant="purple"
                  />
                </div>
              )}
            </div>

            {/* Flagged Observations Table */}
            {highConsumptionData && (
              <div className="card-box mt-4">
                <div className="flex items-center justify-between">
                  <h3 className="card-heading">
                    Flagged Exceedance Observations (Top 50 Exceedances)
                  </h3>
                  <span className="badge badge-rose text-xs">
                    Threshold: &gt; {formatNumber(highConsumptionData.calculated_threshold_kwh, 2)} kWh
                  </span>
                </div>
                <table className="data-table mt-3">
                  <thead>
                    <tr>
                      <th>Record ID</th>
                      <th>Timestamp</th>
                      <th>Sector</th>
                      <th>District</th>
                      <th>Hour</th>
                      <th>Peak Status</th>
                      <th>Observed Consumption</th>
                      <th>Exceedance Delta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {highConsumptionData.flagged_records.map((rec) => (
                      <tr key={rec.id}>
                        <td><code>#{rec.id}</code></td>
                        <td>{rec.timestamp}</td>
                        <td>
                          <span
                            className="inline-block w-2 h-2 rounded-full mr-1.5"
                            style={{ backgroundColor: SECTOR_COLORS[rec.sector] || '#64748b' }}
                          />
                          {rec.sector}
                        </td>
                        <td>{rec.district}</td>
                        <td>{rec.hour.toString().padStart(2, '0')}:00</td>
                        <td>
                          <span className={`pill-badge ${rec.peak_period_flag === 1 ? 'pill-badge-amber' : 'pill-badge-default'}`}>
                            {rec.peak_period_flag === 1 ? 'Peak' : 'Non-Peak'}
                          </span>
                        </td>
                        <td>
                          <strong className="text-rose-700 font-mono">
                            {formatKwh(rec.energy_consumption_kwh)}
                          </strong>
                        </td>
                        <td>
                          <span className="text-amber-800 font-mono text-xs">
                            +{formatNumber(rec.exceedance_delta_kwh, 2)} kWh
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Raw Records Explorer */}
        {activeTab === 'records' && consumptionData && (
          <div className="card-box mt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="card-heading">Database Records Explorer</h3>
                <p className="card-subheading">
                  Showing records {(appliedFilters.offset ?? 0) + 1} to{' '}
                  {Math.min(
                    (appliedFilters.offset ?? 0) + (appliedFilters.limit ?? 25),
                    consumptionData.pagination.total_matching
                  )}{' '}
                  of {formatNumber(consumptionData.pagination.total_matching)} matching rows
                </p>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center gap-2">
                <button
                  className="btn btn-secondary text-xs flex items-center gap-1"
                  disabled={(appliedFilters.offset ?? 0) === 0 || loading}
                  onClick={() => handlePageChange((appliedFilters.offset ?? 0) - (appliedFilters.limit ?? 25))}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <span className="text-xs text-slate-600 px-2">
                  Page {Math.floor((appliedFilters.offset ?? 0) / (appliedFilters.limit ?? 25)) + 1} of{' '}
                  {Math.max(1, Math.ceil(consumptionData.pagination.total_matching / (appliedFilters.limit ?? 25)))}
                </span>
                <button
                  className="btn btn-secondary text-xs flex items-center gap-1"
                  disabled={
                    (appliedFilters.offset ?? 0) + (appliedFilters.limit ?? 25) >=
                      consumptionData.pagination.total_matching || loading
                  }
                  onClick={() => handlePageChange((appliedFilters.offset ?? 0) + (appliedFilters.limit ?? 25))}
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Timestamp</th>
                  <th>Sector</th>
                  <th>District</th>
                  <th>Season</th>
                  <th>Hour</th>
                  <th>Peak</th>
                  <th>Demand (kWh)</th>
                </tr>
              </thead>
              <tbody>
                {consumptionData.records.map((r) => (
                  <tr key={r.id}>
                    <td><code>#{r.id}</code></td>
                    <td>{r.timestamp}</td>
                    <td>
                      <span
                        className="inline-block w-2 h-2 rounded-full mr-1.5"
                        style={{ backgroundColor: SECTOR_COLORS[r.sector] || '#64748b' }}
                      />
                      {r.sector}
                    </td>
                    <td>{r.district}</td>
                    <td>{r.season}</td>
                    <td>{r.hour.toString().padStart(2, '0')}:00</td>
                    <td>
                      <span className={`pill-badge ${r.peak_period_flag === 1 ? 'pill-badge-amber' : 'pill-badge-default'}`}>
                        {r.peak_period_flag === 1 ? 'Peak' : 'Off-Peak'}
                      </span>
                    </td>
                    <td>
                      <strong className="font-mono text-emerald-800">
                        {formatKwh(r.energy_consumption_kwh)}
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
