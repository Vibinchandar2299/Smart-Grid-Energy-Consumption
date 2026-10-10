import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  badge?: string;
  variant?: 'cyan' | 'purple' | 'amber' | 'emerald' | 'rose' | 'default';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  badge,
  variant = 'default',
}) => {
  return (
    <div className={`metric-card metric-card-${variant}`}>
      <div className="metric-header">
        <span className="metric-title">{title}</span>
        {badge && <span className="metric-badge">{badge}</span>}
      </div>
      <div className="metric-value">{value}</div>
      {subtitle && <div className="metric-subtitle">{subtitle}</div>}
    </div>
  );
};
