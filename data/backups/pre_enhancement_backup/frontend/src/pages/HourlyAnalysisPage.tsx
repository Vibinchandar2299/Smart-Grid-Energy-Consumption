import React, { useEffect, useState } from 'react';
import { hourlyApi } from '../api/services/hourlyApi';
import { HourlyAnalysisData } from '../types/segment';
import { MetricCard } from '../components/common/MetricCard';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const HourlyAnalysisPage: React.FC = () => {
  const [data, setData] = useState<HourlyAnalysisData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    hourlyApi
      .getHourlyProfiles()
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load hourly profiles');
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="page-loading">Loading hourly diurnal profile...</div>;
  if (error) return <div className="page-error">Error: {error}</div>;
  if (!data) return null;

  const chartData = data.hourly_profiles.map((p) => ({
    hour: `${p.hour}:00`,
    mean: p.mean_kwh,
    std: p.std_kwh,
    isPeak: p.peak_period_flag,
  }));

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">6. Hourly Diurnal Profile & Load Pattern Modeling</h2>
        <p className="page-description">
          24-hour cycle diurnal load curves and peak period flagging across smart grid feeder lines.
        </p>
      </div>

      <div className="metrics-grid">
        <MetricCard
          title="Grid Peak Windows"
          value={data.peak_hours_range}
          subtitle="Morning and evening load peaks"
          variant="amber"
        />
        <MetricCard
          title="Temporal Resolution"
          value="1-Hour Blocks"
          subtitle="24 discrete hourly strata"
          variant="cyan"
        />
        <MetricCard
          title="Pattern Type"
          value="Bimodal Diurnal"
          subtitle="Synchronous morning & evening surges"
          variant="purple"
        />
      </div>

      <div className="chart-card mt-6">
        <div className="chart-header">
          <h3 className="chart-title">24-Hour Diurnal Demand Curve (Mean kWh)</h3>
          <span className="chart-badge">Peak Hours: 09-12h & 18-21h</span>
        </div>
        <div className="chart-body" style={{ height: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
              <defs>
                <linearGradient id="hourlyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="hour" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f8fafc',
                }}
              />
              <Area
                type="monotone"
                dataKey="mean"
                name="Average Load (kWh)"
                stroke="#06b6d4"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#hourlyGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
