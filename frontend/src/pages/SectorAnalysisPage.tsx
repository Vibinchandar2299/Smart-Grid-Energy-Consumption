import React, { useEffect, useState } from 'react';
import { Building2, Factory, Home, Wheat, HelpCircle, Activity, Award, TrendingUp } from 'lucide-react';
import { sectorApi } from '../api/services/sectorApi';
import { SectorAnalysisData } from '../types/segment';
import { MetricCard } from '../components/common/MetricCard';
import { formatNumber, formatKwh, formatGwh, formatPercent } from '../utils/formatters';
import { SECTOR_COLORS } from '../utils/constants';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';

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
        setError(err.message || 'Failed to load sector analysis data');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-loading">
          <Activity className="w-6 h-6 text-emerald-600 animate-spin" style={{ margin: '0 auto 0.75rem' }} />
          Loading consumer sector models...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-container">
        <div className="page-error">
          <strong>Error loading sectors:</strong> {error || 'Data unavailable'}
        </div>
      </div>
    );
  }

  // Calculate cumulative kWh per sector and total across all sectors
  const sectorCalcs = data.sectors.map((sec) => {
    const totalKwh = sec.count * sec.mean_kwh;
    return {
      ...sec,
      totalKwh,
      totalGwh: totalKwh / 1_000_000,
    };
  });

  const totalGridKwh = sectorCalcs.reduce((acc, curr) => acc + curr.totalKwh, 0);

  // Add share percentages and sort by mean consumption descending
  const enrichedSectors = sectorCalcs.map((sec) => ({
    ...sec,
    sharePercent: (sec.totalKwh / totalGridKwh) * 100,
    color: SECTOR_COLORS[sec.segment_value] || '#059669',
  })).sort((a, b) => b.mean_kwh - a.mean_kwh);

  const highestSector = enrichedSectors.find((s) => s.segment_value === data.highest_consuming_sector) || enrichedSectors[0];
  const lowestSector = enrichedSectors[enrichedSectors.length - 1];

  const getSectorIcon = (name: string) => {
    switch (name) {
      case 'Industrial':
        return <Factory className="w-4 h-4 text-emerald-600" />;
      case 'Commercial':
        return <Building2 className="w-4 h-4 text-blue-600" />;
      case 'Agriculture':
        return <Wheat className="w-4 h-4 text-amber-600" />;
      case 'Domestic':
        return <Home className="w-4 h-4 text-sky-600" />;
      default:
        return <HelpCircle className="w-4 h-4 text-slate-500" />;
    }
  };

  const getSectorRole = (name: string) => {
    switch (name) {
      case 'Industrial':
        return 'Continuous manufacturing & heavy industrial machinery';
      case 'Commercial':
        return 'Commercial offices, retail complexes & hospitality';
      case 'Agriculture':
        return 'Irrigation tube wells & rural agricultural feeders';
      case 'Domestic':
        return 'Residential household lighting, cooking & cooling';
      default:
        return 'Public lighting, municipal waterworks & unclassified';
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">Sector-Wise Consumption Analysis</h2>
        <p className="page-description">
          Cross-sector load comparison across Industrial, Commercial, Agriculture, Domestic, and Miscellaneous consumer categories.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="metrics-grid">
        <MetricCard
          title="Highest Demand Sector"
          value={highestSector.segment_value}
          unit={`${formatNumber(highestSector.mean_kwh, 2)} kWh`}
          subtitle="Highest average intensity"
          badge="High Load"
          icon={<Award className="w-4 h-4 text-emerald-600" />}
          variant="emerald"
        />

        <MetricCard
          title="Lowest Demand Sector"
          value={lowestSector.segment_value}
          unit={`${formatNumber(lowestSector.mean_kwh, 2)} kWh`}
          subtitle="Baseline residential usage"
          badge="Baseline"
          icon={<Home className="w-4 h-4 text-blue-600" />}
          variant="blue"
        />

        <MetricCard
          title="Industrial Load Share"
          value={formatPercent(highestSector.sharePercent, 1)}
          subtitle="25.96% of total monitored grid energy"
          badge="Grid Impact"
          icon={<TrendingUp className="w-4 h-4 text-amber-600" />}
          variant="amber"
        />

        <MetricCard
          title="Evaluated Categories"
          value="5 Sectors"
          subtitle="1,000,000 smart meter records"
          badge="Complete Coverage"
          icon={<Building2 className="w-4 h-4 text-slate-600" />}
          variant="default"
        />
      </div>

      {/* Charts & Shares Grid */}
      <div className="grid-2-col">
        {/* Simple Bar Chart: Average Consumption by Sector */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">Average Hourly Demand by Sector</h3>
              <p className="chart-subtitle">Mean energy consumption per meter-hour (kWh/hr)</p>
            </div>
            <span className="chart-badge">Mean Intensity</span>
          </div>

          <div style={{ height: 320, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={enrichedSectors} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="segment_value" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit=" kWh" />
                <Tooltip
                  formatter={(val: any) => [`${val} kWh`, 'Mean Hourly Demand']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
                    fontSize: '0.825rem',
                  }}
                />
                <Bar dataKey="mean_kwh" radius={[6, 6, 0, 0]}>
                  {enrichedSectors.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sector Consumption Share Card */}
        <div className="card-box" style={{ display: 'flex', flexDirections: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="card-heading">Grid Energy Share Breakdown</div>
            <p className="card-subheading">
              Proportion of total monitored energy (14.74 GWh) consumed by each sector.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              {enrichedSectors.map((sec) => (
                <div key={sec.segment_value}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem', fontSize: '0.825rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-title)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {getSectorIcon(sec.segment_value)}
                      {sec.segment_value}
                      {sec.segment_value === highestSector.segment_value && (
                        <span className="pill-badge pill-badge-emerald" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                          Top Load
                        </span>
                      )}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      <strong>{formatPercent(sec.sharePercent, 1)}</strong> ({formatNumber(sec.totalGwh, 2)} GWh)
                    </span>
                  </div>
                  <div className="progress-bar-bg" style={{ height: '7px' }}>
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${sec.sharePercent}%`,
                        backgroundColor: sec.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="notice-box mt-4">
            <strong>Share Formulation:</strong> Sector shares are computed as $(\text{Count} \times \overline{x}_{\text{sector}}) / \text{Total Monitored Energy}$. Miscellaneous represents 40% of meter connections (municipal, street lighting, unclassified), while Industrial commands 25.96% of total load with only 15% of meter connections.
          </div>
        </div>
      </div>

      {/* Clean Modern Summary Table (No Research Statistics) */}
      <div className="card-box mt-4">
        <div className="card-heading">Sector Performance Summary</div>
        <p className="card-subheading">
          Operational load intensity and grid allocation across consumer categories.
        </p>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Sector</th>
                <th>Grid Classification</th>
                <th>Meter Readings</th>
                <th>Average Load</th>
                <th>Median Load</th>
                <th>Standard Deviation</th>
                <th>Total Energy</th>
                <th>Grid Share</th>
              </tr>
            </thead>
            <tbody>
              {enrichedSectors.map((sec) => {
                const isTop = sec.segment_value === highestSector.segment_value;
                return (
                  <tr key={sec.segment_value} style={isTop ? { backgroundColor: 'var(--emerald-50)' } : undefined}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {getSectorIcon(sec.segment_value)}
                        <strong>{sec.segment_value}</strong>
                        {isTop && (
                          <span className="pill-badge pill-badge-emerald" style={{ fontSize: '0.65rem' }}>
                            Highest Demand
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {getSectorRole(sec.segment_value)}
                    </td>
                    <td>{sec.count.toLocaleString()}</td>
                    <td><strong>{formatKwh(sec.mean_kwh)}</strong></td>
                    <td>{formatKwh(sec.median_kwh)}</td>
                    <td style={{ color: 'var(--text-muted)' }}>±{formatNumber(sec.std_kwh, 2)} kWh</td>
                    <td>{formatNumber(sec.totalGwh, 2)} GWh</td>
                    <td>
                      <span className="pill-badge" style={{ fontWeight: 700 }}>
                        {formatPercent(sec.sharePercent, 1)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
