import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { CurvePoint } from '../../types/distribution';
import { DISTRIBUTION_COLORS } from '../../utils/constants';

interface DistributionFitChartProps {
  data: CurvePoint[];
  title?: string;
}

export const DistributionFitChart: React.FC<DistributionFitChartProps> = ({
  data,
  title = 'Probability Density Functions (PDF) of Fitted Distributions',
}) => {
  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3 className="chart-title">{title}</h3>
        <span className="chart-badge">Pre-computed Frozen Curves</span>
      </div>
      <div className="chart-body" style={{ height: 360, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis
              dataKey="x"
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              label={{
                value: 'Energy Consumption (kWh)',
                position: 'insideBottom',
                offset: -10,
                fill: '#94a3b8',
                fontSize: 12,
              }}
            />
            <YAxis
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              label={{
                value: 'Probability Density f(x)',
                angle: -90,
                position: 'insideLeft',
                fill: '#94a3b8',
                fontSize: 12,
              }}
            />
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
            <Line
              type="monotone"
              dataKey="gamma_pdf"
              name="Gamma PDF (Rank 1)"
              stroke={DISTRIBUTION_COLORS.Gamma}
              strokeWidth={3}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="lognormal_pdf"
              name="Log-normal PDF (Rank 2)"
              stroke={DISTRIBUTION_COLORS['Log-normal']}
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="weibull_pdf"
              name="Weibull PDF (Rank 3)"
              stroke={DISTRIBUTION_COLORS.Weibull}
              strokeWidth={2}
              strokeDasharray="2 2"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="normal_pdf"
              name="Normal PDF (Rank 4)"
              stroke={DISTRIBUTION_COLORS.Normal}
              strokeWidth={2}
              strokeDasharray="6 2"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
