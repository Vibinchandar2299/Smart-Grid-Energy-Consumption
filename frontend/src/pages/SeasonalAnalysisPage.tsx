import React, { useEffect, useState } from 'react';
import { seasonalApi } from '../api/services/seasonalApi';
import { SeasonalAnalysisData } from '../types/segment';
import { MetricCard } from '../components/common/MetricCard';
import { formatNumber, formatKwh } from '../utils/formatters';

export const SeasonalAnalysisPage: React.FC = () => {
  const [data, setData] = useState<SeasonalAnalysisData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    seasonalApi
      .getSeasonalAnalysis()
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load seasonal analysis');
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="page-loading">Loading seasonal analysis...</div>;
  if (error) return <div className="page-error">Error: {error}</div>;
  if (!data) return null;

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">5. Seasonal Distribution Modulation</h2>
        <p className="page-description">
          Weather-correlated distribution variance across Tamil Nadu's climatic cycles (Summer, Monsoon, Post-Monsoon, Winter).
        </p>
      </div>

      <div className="metrics-grid">
        <MetricCard
          title="Peak Seasonal Demand"
          value={data.peak_season}
          subtitle="Highest thermal cooling load"
          variant="amber"
        />
        <MetricCard
          title="Lowest Seasonal Demand"
          value={data.lowest_season}
          subtitle="Temperate precipitation period"
          variant="cyan"
        />
        <MetricCard
          title="Climatic Regimes Analyzed"
          value={data.seasons.length}
          subtitle="Annual 4-season breakdown"
          variant="purple"
        />
      </div>

      <div className="card-box mt-6">
        <h3 className="card-heading">Climatic Season Parameter Decomposition</h3>
        <p className="summary-text">{data.statistical_summary}</p>

        <table className="data-table mt-4">
          <thead>
            <tr>
              <th>Season</th>
              <th>Sample Count</th>
              <th>Mean (kWh)</th>
              <th>Median (kWh)</th>
              <th>Std Dev (kWh)</th>
              <th>Skewness</th>
              <th>Best Fit Distribution</th>
              <th>KS Stat</th>
            </tr>
          </thead>
          <tbody>
            {data.seasons.map((season) => (
              <tr key={season.segment_value}>
                <td><strong>{season.segment_value}</strong></td>
                <td>{season.count.toLocaleString()}</td>
                <td>{formatKwh(season.mean_kwh)}</td>
                <td>{formatKwh(season.median_kwh)}</td>
                <td>±{formatNumber(season.std_kwh)}</td>
                <td>{formatNumber(season.skewness, 2)}</td>
                <td><span className="pill-badge">{season.best_fit_dist}</span></td>
                <td>{formatNumber(season.ks_stat, 4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
