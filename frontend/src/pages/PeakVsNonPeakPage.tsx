import React, { useEffect, useState } from 'react';
import { peakApi } from '../api/services/peakApi';
import { PeakAnalysisData } from '../types/segment';
import { MetricCard } from '../components/common/MetricCard';
import { formatNumber, formatKwh } from '../utils/formatters';

export const PeakVsNonPeakPage: React.FC = () => {
  const [data, setData] = useState<PeakAnalysisData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    peakApi
      .getPeakAnalysis()
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load peak analysis');
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="page-loading">Loading peak period analysis...</div>;
  if (error) return <div className="page-error">Error: {error}</div>;
  if (!data) return null;

  const { peak, non_peak, ratio_peak_to_non_peak_mean, statistical_summary } = data;

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">4. Peak vs Non-Peak Consumption Dynamics</h2>
        <p className="page-description">
          Statistical distribution bifurcation between grid stress periods and baseline operations.
        </p>
      </div>

      <div className="metrics-grid">
        <MetricCard
          title="Peak Demand Multiplier"
          value={`${ratio_peak_to_non_peak_mean}x`}
          subtitle="Peak mean / Non-peak mean"
          variant="amber"
        />
        <MetricCard
          title="Peak Period Mean"
          value={formatKwh(peak.mean_kwh)}
          subtitle={`Std: ±${formatNumber(peak.std_kwh)} kWh`}
          variant="rose"
        />
        <MetricCard
          title="Non-Peak Period Mean"
          value={formatKwh(non_peak.mean_kwh)}
          subtitle={`Std: ±${formatNumber(non_peak.std_kwh)} kWh`}
          variant="cyan"
        />
        <MetricCard
          title="Peak Distribution Fit"
          value={peak.best_fit_dist}
          subtitle={`Non-Peak Fit: ${non_peak.best_fit_dist}`}
          variant="purple"
        />
      </div>

      <div className="card-box mt-6">
        <h3 className="card-heading">Comparative Distribution Properties</h3>
        <p className="summary-text">{statistical_summary}</p>

        <table className="data-table mt-4">
          <thead>
            <tr>
              <th>Period Type</th>
              <th>Sample Count</th>
              <th>Mean (kWh)</th>
              <th>Median (kWh)</th>
              <th>Std Dev (kWh)</th>
              <th>Skewness</th>
              <th>Kurtosis</th>
              <th>Optimal Distribution</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span className="pill-badge pill-amber">Peak Hours</span></td>
              <td>{peak.count.toLocaleString()}</td>
              <td>{formatKwh(peak.mean_kwh)}</td>
              <td>{formatKwh(peak.median_kwh)}</td>
              <td>±{formatNumber(peak.std_kwh)}</td>
              <td>{formatNumber(peak.skewness, 2)}</td>
              <td>{formatNumber(peak.kurtosis, 2)}</td>
              <td><strong>{peak.best_fit_dist}</strong></td>
            </tr>
            <tr>
              <td><span className="pill-badge pill-cyan">Non-Peak Hours</span></td>
              <td>{non_peak.count.toLocaleString()}</td>
              <td>{formatKwh(non_peak.mean_kwh)}</td>
              <td>{formatKwh(non_peak.median_kwh)}</td>
              <td>±{formatNumber(non_peak.std_kwh)}</td>
              <td>{formatNumber(non_peak.skewness, 2)}</td>
              <td>{formatNumber(non_peak.kurtosis, 2)}</td>
              <td><strong>{non_peak.best_fit_dist}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
