import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  badge?: string;
  icon?: React.ReactNode;
  variant?: 'emerald' | 'blue' | 'amber' | 'rose' | 'cyan' | 'purple' | 'default' | string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  subtitle,
  badge,
  icon,
  variant = 'default',
}) => {
  return (
    <div className={`metric-card metric-card-${variant}`}>
      <div className="metric-header">
        <span className="metric-title">{title}</span>
        {badge && <span className="metric-badge">{badge}</span>}
        {icon && <span className="metric-icon">{icon}</span>}
      </div>
      <div className="metric-value-wrap">
        <span className="metric-value">{value}</span>
        {unit && <span className="metric-unit">{unit}</span>}
      </div>
      {subtitle && <div className="metric-subtitle">{subtitle}</div>}
    </div>
  );
};
