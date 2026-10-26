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

interface VisibleCurvesState {
  lognormal: boolean;
  weibull: boolean;
  normal: boolean;
  gamma: boolean;
}

interface DistributionFitChartProps {
  data: CurvePoint[];
  title?: string;
  visibleCurves?: VisibleCurvesState;
  resolutionPoints?: number;
}

export const DistributionFitChart: React.FC<DistributionFitChartProps> = ({
  data,
  title = 'Probability Density Functions (PDF) of Fitted Distributions',
  visibleCurves = { lognormal: true, weibull: true, normal: true, gamma: true },
  resolutionPoints = 120,
}) => {
  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <h3 className="chart-title">{title}</h3>
          <p className="chart-subtitle">Continuous PDF evaluation over energy consumption domain (0–70 kWh)</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="chart-badge font-mono text-xs">
            Resolution: {resolutionPoints} points
          </span>
        </div>
      </div>
      <div className="chart-body" style={{ height: 380, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="x"
              stroke="#94a3b8"
              tick={{ fill: '#64748b', fontSize: 11 }}
              label={{
                value: 'Energy Consumption (kWh)',
                position: 'insideBottom',
                offset: -10,
                fill: '#64748b',
                fontSize: 12,
              }}
            />
            <YAxis
              stroke="#94a3b8"
              tick={{ fill: '#64748b', fontSize: 11 }}
              label={{
                value: 'Probability Density f(x)',
                angle: -90,
                position: 'insideLeft',
                fill: '#64748b',
                fontSize: 12,
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                color: '#1e293b',
                fontSize: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
              }}
              formatter={(val: any, name: any) => [
                Number(val).toFixed(5),
                name,
              ]}
              labelFormatter={(label) => `Consumption: ${Number(label).toFixed(2)} kWh`}
            />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ color: '#475569', fontSize: '12px' }} />

            {/* Rank #1: Log-normal */}
            {visibleCurves.lognormal && (
              <Line
                type="monotone"
                dataKey="lognormal_pdf"
                name="Log-normal PDF (Rank #1 - Lowest AIC)"
                stroke={DISTRIBUTION_COLORS['Log-normal']}
                strokeWidth={3}
                dot={false}
              />
            )}

            {/* Rank #2: Weibull */}
            {visibleCurves.weibull && (
              <Line
                type="monotone"
                dataKey="weibull_pdf"
                name="Weibull PDF (Rank #2)"
                stroke={DISTRIBUTION_COLORS.Weibull}
                strokeWidth={2.5}
                strokeDasharray="4 4"
                dot={false}
              />
            )}

            {/* Rank #3: Normal */}
            {visibleCurves.normal && (
              <Line
                type="monotone"
                dataKey="normal_pdf"
                name="Normal PDF (Rank #3)"
                stroke={DISTRIBUTION_COLORS.Normal}
                strokeWidth={2}
                strokeDasharray="6 2"
                dot={false}
              />
            )}

            {/* Rank #4: Gamma */}
            {visibleCurves.gamma && (
              <Line
                type="monotone"
                dataKey="gamma_pdf"
                name="Gamma PDF (Rank #4)"
                stroke={DISTRIBUTION_COLORS.Gamma}
                strokeWidth={2}
                strokeDasharray="2 2"
                dot={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
