import React, { useEffect, useState } from 'react';
import { temporalApi } from '../api/services/temporalApi';
import { TemporalShiftData } from '../types/segment';
import { MetricCard } from '../components/common/MetricCard';
import { formatNumber, formatKwh } from '../utils/formatters';

export const TemporalShiftPage: React.FC = () => {
  const [data, setData] = useState<TemporalShiftData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    temporalApi
      .getTemporalShift()
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load temporal shift analysis');
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="page-loading">Loading temporal distribution shift...</div>;
  if (error) return <div className="page-error">Error: {error}</div>;
  if (!data) return null;

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">7. Temporal Distribution Shift Across Years (2022–2025)</h2>
        <p className="page-description">
          Tracking parameter drift and long-term consumption distribution shifts across multi-year smart grid observations.
        </p>
      </div>

      <div className="metrics-grid">
        <MetricCard
          title="Overall Secular Trend"
          value={data.overall_trend}
          subtitle="Multi-year growth pattern"
          variant="cyan"
        />
        <MetricCard
          title="Observation Window"
          value="2022 – 2025"
          subtitle="4 longitudinal annual cohorts"
          variant="purple"
        />
      </div>

      <div className="card-box mt-6">
        <h3 className="card-heading">Year-over-Year Distribution Evolution</h3>
        <p className="summary-text">{data.statistical_summary}</p>

        <table className="data-table mt-4">
          <thead>
            <tr>
              <th>Year</th>
              <th>Mean (kWh)</th>
              <th>Median (kWh)</th>
              <th>Std Dev (kWh)</th>
              <th>Skewness</th>
              <th>Kurtosis</th>
              <th>Best Fit Distribution</th>
              <th>Shift vs Base Year</th>
            </tr>
          </thead>
          <tbody>
            {data.shifts.map((s) => (
              <tr key={s.year}>
                <td><strong>{s.year}</strong></td>
                <td>{formatKwh(s.mean_kwh)}</td>
                <td>{formatKwh(s.median_kwh)}</td>
                <td>±{formatNumber(s.std_kwh)}</td>
                <td>{formatNumber(s.skewness, 2)}</td>
                <td>{formatNumber(s.kurtosis, 2)}</td>
                <td><span className="pill-badge">{s.best_fit_dist}</span></td>
                <td>
                  <span className={`shift-tag ${s.shift_percentage > 0 ? 'shift-positive' : ''}`}>
                    {s.shift_percentage >= 0 ? `+${s.shift_percentage}%` : `${s.shift_percentage}%`}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
