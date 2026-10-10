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
  Area,
} from 'recharts';
import { ExtremeValueItem } from '../../types/extremeValue';

interface ReturnLevelPlotProps {
  data: ExtremeValueItem[];
  blockType: string;
}

export const ReturnLevelPlot: React.FC<ReturnLevelPlotProps> = ({ data, blockType }) => {
  const chartData = data.map((d) => ({
    return_period: `${d.return_period_years}y`,
    years: d.return_period_years,
    return_level: d.return_level_kwh,
    ci_lower: d.ci_lower_95,
    ci_upper: d.ci_upper_95,
  }));

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3 className="chart-title">GEV Return Level Curve ({blockType.replace('_', ' ')})</h3>
        <span className="chart-badge">95% Confidence Bounds</span>
      </div>
      <div className="chart-body" style={{ height: 350, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis
              dataKey="return_period"
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              label={{
                value: 'Return Period (Years)',
                position: 'insideBottom',
                offset: -10,
                fill: '#94a3b8',
                fontSize: 12,
              }}
            />
            <YAxis
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              domain={['auto', 'auto']}
              label={{
                value: 'Peak Level (kWh)',
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
              dataKey="return_level"
              name="Expected Return Level (kWh)"
              stroke="#f59e0b"
              strokeWidth={3}
              dot={{ r: 5, fill: '#f59e0b' }}
            />
            <Line
              type="monotone"
              dataKey="ci_upper"
              name="95% Upper CI"
              stroke="#ef4444"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="ci_lower"
              name="95% Lower CI"
              stroke="#10b981"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
