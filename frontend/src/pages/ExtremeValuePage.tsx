import React, { useEffect, useState } from 'react';
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

  if (loading) return <div className="page-loading">Loading extreme value analysis...</div>;
  if (error) return <div className="page-error">Error: {error}</div>;
  if (!data) return null;

  const { gev_parameters } = data;

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-split">
          <div>
            <h2 className="page-title">8. Extreme Value Theory & Return Level Modeling</h2>
            <p className="page-description">
              Generalized Extreme Value (GEV) distribution fitted on block maxima to quantify tail risk and grid blackout thresholds.
            </p>
          </div>
          <div className="toggle-group">
            <button
              className={`toggle-btn ${blockType === 'daily_maxima' ? 'toggle-active' : ''}`}
              onClick={() => setBlockType('daily_maxima')}
            >
              Daily Maxima (Active)
            </button>
            <button
              className={`toggle-btn ${blockType === 'monthly_maxima' ? 'toggle-active' : ''}`}
              onClick={() => setBlockType('monthly_maxima')}
              title="Legacy monthly maxima are quarantined"
            >
              Monthly Maxima (Legacy)
            </button>
          </div>
        </div>
      </div>

      <div className="metrics-grid">
        <MetricCard
          title="Shape Parameter (ξ)"
          value={formatNumber(gev_parameters.shape_xi, 3)}
          subtitle={gev_parameters.domain_type}
          variant={gev_parameters.shape_xi > 0 ? 'rose' : 'cyan'}
          badge={gev_parameters.shape_xi > 0 ? 'Heavy Tailed' : 'Bounded Tail'}
        />
        <MetricCard
          title="Location Parameter (μ)"
          value={formatKwh(gev_parameters.loc_mu)}
          subtitle="Center of block maxima"
          variant="amber"
        />
        <MetricCard
          title="Scale Parameter (σ)"
          value={formatNumber(gev_parameters.scale_sigma, 2)}
          subtitle="Dispersion of extremes"
          variant="purple"
        />
        <MetricCard
          title="Domain Attraction"
          value={gev_parameters.shape_xi > 0 ? 'Fréchet (Type II)' : (gev_parameters.shape_xi < 0 ? 'Weibull (Type III)' : 'Gumbel (Type I)')}
          subtitle="Extreme distribution family"
          variant="emerald"
        />
      </div>

      <div className="mt-6">
        <ReturnLevelPlot data={data.return_levels} blockType={blockType} />
      </div>

      <div className="card-box mt-6">
        <h3 className="card-heading">Calculated Return Levels & Exceedance Probabilities</h3>
        <p className="summary-text">{data.statistical_summary}</p>

        <div className="notice-box mt-3 mb-3 p-3 bg-slate-900 border border-slate-700 rounded text-xs text-slate-400">
          <strong>Statistical Integrity Protocol:</strong> Day-based return periods (7d, 30d, 90d, 180d, 365d, 730d) derived from daily maxima block sampling. Reciprocal return-period rates represent daily recurrence frequency (1/T). 95% bootstrap confidence intervals were not computed in the original research export and remain null (N/A) without synthetic fabrication.
        </div>

        <table className="data-table mt-4">
          <thead>
            <tr>
              <th>Return Period</th>
              <th>Expected Return Level (kWh)</th>
              <th>95% Lower Confidence Bound</th>
              <th>95% Upper Confidence Bound</th>
              <th>Reciprocal Exceedance Rate (1/T)</th>
            </tr>
          </thead>
          <tbody>
            {data.return_levels.map((item) => {
              const key = item.return_period_days ?? item.return_period_years ?? item.return_level_kwh;
              const periodLabel = item.return_period_days
                ? `${item.return_period_days}-Day Event (${item.return_period_years != null ? `${item.return_period_years} yr` : `${(item.return_period_days / 365.25).toFixed(2)} yr`})`
                : `${item.return_period_years}-Year Event`;

              return (
                <tr key={key}>
                  <td><strong>{periodLabel}</strong></td>
                  <td><span className="text-amber font-mono font-bold">{formatKwh(item.return_level_kwh)}</span></td>
                  <td>
                    {item.ci_lower_95 != null ? (
                      formatKwh(item.ci_lower_95)
                    ) : (
                      <span className="text-slate-500 italic text-xs">N/A (uncomputed)</span>
                    )}
                  </td>
                  <td>
                    {item.ci_upper_95 != null ? (
                      <span className="text-rose font-mono">{formatKwh(item.ci_upper_95)}</span>
                    ) : (
                      <span className="text-slate-500 italic text-xs">N/A (uncomputed)</span>
                    )}
                  </td>
                  <td>
                    {item.daily_exceedance_rate != null ? (
                      <code>{formatNumber(item.daily_exceedance_rate * 100, 3)}% daily (1/{item.return_period_days}d)</code>
                    ) : item.return_period_years && item.return_period_years > 0 ? (
                      <code>{formatNumber((1 / item.return_period_years) * 100, 1)}% per year</code>
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
