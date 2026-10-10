import React, { useEffect, useState } from 'react';
import { extremeValueApi } from '../api/services/extremeValueApi';
import { ExtremeValueAnalysisData } from '../types/extremeValue';
import { MetricCard } from '../components/common/MetricCard';
import { ReturnLevelPlot } from '../components/charts/ReturnLevelPlot';
import { formatNumber, formatKwh } from '../utils/formatters';

export const ExtremeValuePage: React.FC = () => {
  const [data, setData] = useState<ExtremeValueAnalysisData | null>(null);
  const [blockType, setBlockType] = useState<'monthly_maxima' | 'daily_maxima'>('monthly_maxima');
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
              className={`toggle-btn ${blockType === 'monthly_maxima' ? 'toggle-active' : ''}`}
              onClick={() => setBlockType('monthly_maxima')}
            >
              Monthly Maxima
            </button>
            <button
              className={`toggle-btn ${blockType === 'daily_maxima' ? 'toggle-active' : ''}`}
              onClick={() => setBlockType('daily_maxima')}
            >
              Daily Maxima
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
          badge={gev_parameters.shape_xi > 0 ? 'Heavy Tailed' : 'Bounded'}
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
          value={gev_parameters.shape_xi > 0 ? 'Fréchet (Type II)' : 'Weibull (Type III)'}
          subtitle="Extreme distribution family"
          variant="emerald"
        />
      </div>

      <div className="mt-6">
        <ReturnLevelPlot data={data.return_levels} blockType={blockType} />
      </div>

      <div className="card-box mt-6">
        <h3 className="card-heading">Calculated Return Levels & Confidence Intervals</h3>
        <p className="summary-text">{data.statistical_summary}</p>

        <table className="data-table mt-4">
          <thead>
            <tr>
              <th>Return Period</th>
              <th>Expected Return Level (kWh)</th>
              <th>95% Lower Confidence Bound</th>
              <th>95% Upper Confidence Bound</th>
              <th>Annual Exceedance Probability</th>
            </tr>
          </thead>
          <tbody>
            {data.return_levels.map((item) => (
              <tr key={item.return_period_years}>
                <td><strong>{item.return_period_years}-Year Event</strong></td>
                <td><span className="text-amber font-mono font-bold">{formatKwh(item.return_level_kwh)}</span></td>
                <td>{formatKwh(item.ci_lower_95)}</td>
                <td><span className="text-rose font-mono">{formatKwh(item.ci_upper_95)}</span></td>
                <td><code>{formatNumber((1 / item.return_period_years) * 100, 1)}% per year</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
