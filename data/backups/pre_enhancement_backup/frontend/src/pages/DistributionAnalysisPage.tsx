import React, { useEffect, useState } from 'react';
import { distributionApi } from '../api/services/distributionApi';
import { DistributionComparisonData, CurvePoint } from '../types/distribution';
import { DistributionFitChart } from '../components/charts/DistributionFitChart';
import { MetricsBarChart } from '../components/charts/MetricsBarChart';
import { MetricCard } from '../components/common/MetricCard';
import { formatNumber, formatScientific } from '../utils/formatters';

export const DistributionAnalysisPage: React.FC = () => {
  const [comparison, setComparison] = useState<DistributionComparisonData | null>(null);
  const [curves, setCurves] = useState<CurvePoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([distributionApi.getComparison(), distributionApi.getCurves(120)])
      .then(([compRes, curveRes]) => {
        setComparison(compRes.data);
        setCurves(curveRes.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load distribution analysis');
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="page-loading">Loading distribution analysis...</div>;
  if (error) return <div className="page-error">Error: {error}</div>;
  if (!comparison) return null;

  const desc = comparison.descriptive_statistics;

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">2. Probability Distribution Fitting & Goodness-of-Fit</h2>
        <p className="page-description">
          Benchmarking Normal, Log-normal, Gamma, and Weibull distributions against empirical energy consumption patterns.
        </p>
      </div>

      <div className="metrics-grid">
        <MetricCard
          title="Skewness"
          value={formatNumber(desc.skewness, 3)}
          subtitle="Positive right tail"
          variant="cyan"
        />
        <MetricCard
          title="Kurtosis"
          value={formatNumber(desc.kurtosis, 3)}
          subtitle="Leptokurtic excess"
          variant="purple"
        />
        <MetricCard
          title="Interquartile Range"
          value={`${formatNumber(desc.q25)} - ${formatNumber(desc.q75)} kWh`}
          subtitle={`Median: ${formatNumber(desc.median)} kWh`}
          variant="amber"
        />
        <MetricCard
          title="Selected Distribution"
          value={comparison.best_distribution}
          subtitle="Lowest AIC & KS Distance"
          variant="emerald"
        />
      </div>

      <div className="grid-2-col mt-6">
        <DistributionFitChart data={curves} />
        <MetricsBarChart fits={comparison.distribution_fits} />
      </div>

      <div className="card-box mt-6">
        <h3 className="card-heading">Goodness-of-Fit Comparison Table</h3>
        
        <div className="notice-box mt-3 mb-3 p-3 bg-slate-900 border border-slate-700 rounded text-xs text-slate-400">
          <strong>Provenance & Methodology Note:</strong> Probability distribution parameters and goodness-of-fit metrics are derived from Google Colab maximum-likelihood estimation (MLE) labeled <em>Unverified Local Provenance</em>. Anderson-Darling (AD) statistics were not computed in the research export and remain null (N/A). Empirical descriptive statistics above represent the authentic 1,000,000-observation dataset.
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Distribution</th>
              <th>Parameters</th>
              <th>AIC</th>
              <th>BIC</th>
              <th>KS Stat (D)</th>
              <th>KS p-value</th>
              <th>AD Stat (A²)</th>
            </tr>
          </thead>
          <tbody>
            {comparison.distribution_fits.map((fit) => (
              <tr key={fit.distribution} className={fit.rank === 1 ? 'row-highlight' : ''}>
                <td><span className={`rank-badge rank-${fit.rank}`}>#{fit.rank}</span></td>
                <td><strong>{fit.distribution}</strong></td>
                <td>
                  <code>
                    {fit.param_shape !== null && fit.param_shape !== undefined
                      ? `shape=${formatNumber(fit.param_shape, 3)}, `
                      : ''}
                    loc={formatNumber(fit.param_loc, 2)}, scale={formatNumber(fit.param_scale, 2)}
                  </code>
                </td>
                <td>{formatNumber(fit.aic, 1)}</td>
                <td>{formatNumber(fit.bic, 1)}</td>
                <td>{formatNumber(fit.ks_statistic, 4)}</td>
                <td>{formatScientific(fit.ks_pvalue)}</td>
                <td>
                  {fit.ad_statistic != null ? (
                    formatNumber(fit.ad_statistic, 2)
                  ) : (
                    <span className="text-slate-500 italic text-xs">N/A (uncomputed)</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
