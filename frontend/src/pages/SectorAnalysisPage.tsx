import React, { useEffect, useState } from 'react';
import { sectorApi } from '../api/services/sectorApi';
import { SectorAnalysisData } from '../types/segment';
import { MetricCard } from '../components/common/MetricCard';
import { formatNumber, formatKwh } from '../utils/formatters';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

export const SectorAnalysisPage: React.FC = () => {
  const [data, setData] = useState<SectorAnalysisData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    sectorApi
      .getSectors()
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load sector analysis');
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="page-loading">Loading sector analysis...</div>;
  if (error) return <div className="page-error">Error: {error}</div>;
  if (!data) return null;

  const chartData = data.sectors.map((s) => ({
    name: s.segment_value,
    mean: s.mean_kwh,
    std: s.std_kwh,
    median: s.median_kwh,
  }));

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">3. Sector-Wise Distribution Modeling</h2>
        <p className="page-description">
          Comparative empirical behavior across Residential, Commercial, Industrial, and Agricultural demand sectors.
        </p>
      </div>

      <div className="metrics-grid">
        <MetricCard
          title="Highest Demand Sector"
          value={data.highest_consuming_sector}
          subtitle="Top mean load intensity"
          variant="amber"
        />
        <MetricCard
          title="Most Volatile Sector"
          value={data.highest_volatility_sector}
          subtitle="Highest standard deviation"
          variant="rose"
        />
        <MetricCard
          title="Total Sectors Evaluated"
          value={data.sectors.length}
          subtitle="Agriculture, Commercial, Domestic, Industrial, Misc"
          variant="cyan"
        />
      </div>

      <div className="chart-card mt-6">
        <div className="chart-header">
          <h3 className="chart-title">Sector Consumption Moments (Mean & Volatility)</h3>
        </div>
        <div className="chart-body" style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f8fafc',
                }}
              />
              <Legend verticalAlign="top" height={36} />
              <Bar dataKey="mean" name="Mean (kWh)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="median" name="Median (kWh)" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="std" name="Std Dev (kWh)" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card-box mt-6">
        <h3 className="card-heading">Sector Parameter Estimates</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Sector</th>
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
            {data.sectors.map((sec) => (
              <tr key={sec.segment_value}>
                <td><strong>{sec.segment_value}</strong></td>
                <td>{sec.count.toLocaleString()}</td>
                <td>{formatKwh(sec.mean_kwh)}</td>
                <td>{formatKwh(sec.median_kwh)}</td>
                <td>±{formatNumber(sec.std_kwh)}</td>
                <td>{formatNumber(sec.skewness, 2)}</td>
                <td><span className="pill-badge">{sec.best_fit_dist}</span></td>
                <td>{formatNumber(sec.ks_stat, 4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
