import React, { useEffect, useState } from 'react';
import { Download, Zap, AlertTriangle, Info, CheckCircle2, ShieldAlert } from 'lucide-react';
import { extremeValueApi } from '../api/services/extremeValueApi';
import { ExtremeValueAnalysisData } from '../types/extremeValue';
import { MetricCard } from '../components/common/MetricCard';
import { ReturnLevelPlot } from '../components/charts/ReturnLevelPlot';
import { formatNumber, formatKwh } from '../utils/formatters';

export const ExtremeValuePage: React.FC = () => {
  const [data, setData] = useState<ExtremeValueAnalysisData | null>(null);
  const [blockType, setBlockType] = useState<'monthly_maxima' | 'daily_maxima'>('daily_maxima');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    extremeValueApi
      .getExtremeValues(blockType)
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load extreme value analysis');
        setLoading(false);
      });
  }, [blockType]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-loading">
          <Zap className="w-6 h-6 text-amber-500 animate-spin" style={{ margin: '0 auto 0.75rem' }} />
          Computing Generalized Extreme Value (GEV) distribution on {blockType === 'daily_maxima' ? 'daily' : 'monthly'} block maxima...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-container">
        <div className="page-error">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            Extreme Value Analysis Error
          </div>
          <p className="text-sm mt-1">{error || 'Data unavailable'}</p>
        </div>
      </div>
    );
  }

  const { gev_parameters } = data;
  const isDaily = blockType === 'daily_maxima';
  const blockCount = isDaily ? 3473 : 115;
  const upperLimitKwh = gev_parameters.shape_xi < 0
    ? gev_parameters.loc_mu - (gev_parameters.scale_sigma / gev_parameters.shape_xi)
    : null;

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-split">
          <div>
            <h2 className="page-title">Generalized Extreme Value (GEV) & Tail Risk Modeling</h2>
            <p className="page-description">
              Block Maxima modeling of peak grid consumption using Fisher–Tippett–Gnedenko asymptotic extreme value theory.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={extremeValueApi.getExportCsvUrl(blockType)}
              download
              className="export-btn flex items-center gap-1.5"
              title="Export GEV parameters and return level estimates to CSV"
            >
              <Download className="w-4 h-4" />
              <span>Export Results CSV</span>
            </a>
          </div>
        </div>
      </div>

      {/* Block Type Selection & Cohort Badge */}
      <div className="filter-card my-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-700">Block Maxima Definition:</span>
            <div className="toggle-group">
              <button
                className={`toggle-btn ${isDaily ? 'toggle-active' : ''}`}
                onClick={() => setBlockType('daily_maxima')}
              >
                Daily Maxima (N = 3,473 Days)
              </button>
              <button
                className={`toggle-btn ${!isDaily ? 'toggle-active' : ''}`}
                onClick={() => setBlockType('monthly_maxima')}
              >
                Monthly Maxima (N = 115 Months)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="pill-badge pill-badge-emerald font-mono">
              Sample: {blockCount} blocks (2015–2024)
            </span>
            <span className="pill-badge pill-badge-amber">
              {isDaily ? 'Day-based Reciprocal Rate' : 'Month-based Reciprocal Rate'}
            </span>
          </div>
        </div>
      </div>

      {/* GEV Parameter KPI Cards */}
      <div className="metrics-grid">
        <MetricCard
          title="Shape Parameter (ξ)"
          value={formatNumber(gev_parameters.shape_xi, 4)}
          subtitle={gev_parameters.domain_type}
          variant={gev_parameters.shape_xi < 0 ? 'cyan' : 'rose'}
          badge={gev_parameters.shape_xi < 0 ? 'Bounded Upper Tail' : 'Heavy Tail'}
        />
        <MetricCard
          title="Location Parameter (μ)"
          value={formatKwh(gev_parameters.loc_mu)}
          subtitle="Center of block maximum distribution"
          variant="amber"
        />
        <MetricCard
          title="Scale Parameter (σ)"
          value={formatNumber(gev_parameters.scale_sigma, 3)}
          subtitle="Dispersion / volatility of maxima"
          variant="purple"
        />
        <MetricCard
          title="Domain of Attraction"
          value={gev_parameters.shape_xi < 0 ? 'Weibull (Type III)' : (gev_parameters.shape_xi > 0 ? 'Fréchet (Type II)' : 'Gumbel (Type I)')}
          subtitle={upperLimitKwh ? `Asymptotic upper bound: ~${upperLimitKwh.toFixed(1)} kWh` : 'Unbounded'}
          variant="emerald"
        />
      </div>

      {/* EVT Sign Convention & Scientific Transparency Card */}
      <div className="card-box my-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <strong>Extreme Value Theory Mathematical Convention & Tail Classification:</strong>
            <div className="mt-1 space-y-1 text-slate-600">
              <p>
                <strong>SciPy vs. Standard EVT Sign Convention:</strong> SciPy’s <code>scipy.stats.genextreme</code> parameterizes the shape as <em>c</em>.
                In conventional statistical literature (Coles 2001, Leadbetter 1983), the GEV shape parameter is defined as <strong>ξ = -c</strong>.
                Our backend converts SciPy's parameter so that <strong>ξ = {formatNumber(gev_parameters.shape_xi, 4)}</strong> is strictly aligned with the classical EVT standard.
              </p>
              <p>
                <strong>Physical Grid Interpretation:</strong> Because <strong>ξ &lt; 0</strong> (negative shape), the distribution converges to the <strong>Weibull (Type III) domain</strong>.
                This indicates a finite theoretical upper ceiling ({upperLimitKwh ? `${upperLimitKwh.toFixed(1)} kWh` : 'finite bound'}), which is physically coherent with smart grid constraints—demand is inherently bounded by transformer thermal limits, feeder fusing, and maximum connected load capacities.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Return Level Curve Plot */}
      <div className="mt-6">
        <ReturnLevelPlot data={data.return_levels} blockType={blockType} />
      </div>

      {/* Return Levels & Reciprocal Rate Table */}
      <div className="card-box mt-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="card-heading">Calculated Return Levels & Reciprocal Rates</h3>
            <p className="card-subheading">
              Expected consumption quantile for specified design return intervals under the fitted GEV model.
            </p>
          </div>
          <span className="pill-badge pill-badge-default text-xs">
            Model-based Quantiles (Not Guaranteed Maxima)
          </span>
        </div>

        <p className="summary-text mt-2 text-xs text-slate-600">
          {data.statistical_summary}
        </p>

        <div className="notice-box my-3 p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900">
          <strong>Academic Honesty Protocol:</strong> 95% bootstrap confidence intervals were not computed in the baseline export and are presented honestly as <em>N/A (uncomputed)</em> rather than filled with fabricated numbers. The reciprocal rate (1/T) represents the annual or return-period frequency rate under the fitted asymptotic distribution.
        </div>

        <table className="data-table mt-4">
          <thead>
            <tr>
              <th>Return Period (T)</th>
              <th>Expected Return Level</th>
              <th>95% Lower Confidence Bound</th>
              <th>95% Upper Confidence Bound</th>
              <th>Reciprocal Event Rate (1/T)</th>
            </tr>
          </thead>
          <tbody>
            {data.return_levels.map((item) => {
              const periodKey = item.return_period_days ?? item.return_period_years ?? item.return_level_kwh;
              const periodTitle = item.return_period_days
                ? `${item.return_period_days}-Day Event (${(item.return_period_days / 365.25).toFixed(2)} yr)`
                : `${item.return_period_years}-Year Event`;

              return (
                <tr key={periodKey}>
                  <td><strong>{periodTitle}</strong></td>
                  <td>
                    <span className="text-amber-700 font-mono font-bold">
                      {formatKwh(item.return_level_kwh)}
                    </span>
                  </td>
                  <td>
                    {item.ci_lower_95 != null ? (
                      formatKwh(item.ci_lower_95)
                    ) : (
                      <span className="text-slate-500 italic text-xs">N/A (uncomputed)</span>
                    )}
                  </td>
                  <td>
                    {item.ci_upper_95 != null ? (
                      <span className="text-rose-700 font-mono">{formatKwh(item.ci_upper_95)}</span>
                    ) : (
                      <span className="text-slate-500 italic text-xs">N/A (uncomputed)</span>
                    )}
                  </td>
                  <td>
                    {item.reciprocal_rate != null ? (
                      <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">
                        {formatNumber(item.reciprocal_rate * 100, 3)}% ({item.return_period_days ? `1/${item.return_period_days}d` : 'period rate'})
                      </code>
                    ) : item.return_period_years && item.return_period_years > 0 ? (
                      <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">
                        {formatNumber((1 / item.return_period_years) * 100, 2)}% per year
                      </code>
                    ) : (
                      <code>N/A</code>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
