import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { DistributionFit } from '../../types/distribution';

interface MetricsBarChartProps {
  fits: DistributionFit[];
}

export const MetricsBarChart: React.FC<MetricsBarChartProps> = ({ fits }) => {
  const chartData = fits.map((f) => ({
    name: f.distribution,
    ks_stat: Number((f.ks_statistic * 100).toFixed(2)),
    ad_stat: Number(f.ad_statistic.toFixed(1)),
    rank: f.rank,
  }));

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3 className="chart-title">Goodness-of-Fit Distance Metrics (Lower is Superior)</h3>
        <span className="chart-badge">KS & AD Statistics</span>
      </div>
      <div className="chart-body" style={{ height: 320, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '12px',
              }}
            />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ color: '#cbd5e1' }} />
            <Bar dataKey="ks_stat" name="Kolmogorov-Smirnov D (%)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            <Bar dataKey="ad_stat" name="Anderson-Darling Stat (A²)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
