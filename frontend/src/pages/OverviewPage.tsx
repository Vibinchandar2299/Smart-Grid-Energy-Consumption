import React, { useEffect, useState } from 'react';
import { overviewApi, OverviewData } from '../api/services/overviewApi';
import { MetricCard } from '../components/common/MetricCard';
import { formatKwh, formatNumber } from '../utils/formatters';

export const OverviewPage: React.FC = () => {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    overviewApi
      .getOverview()
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch overview data');
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="page-loading">Loading research overview metrics...</div>;
  if (error) return <div className="page-error">Error: {error}</div>;
  if (!data) return null;

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">1. Research Overview & Executive Summary</h2>
        <p className="page-description">
          Authoritative statistical modeling results deployed directly from validated Colab experiments.
        </p>
      </div>

      <div className="metrics-grid">
        <MetricCard
          title="Sample Size (N)"
          value={data.sample_size.toLocaleString()}
          subtitle="Smart-meter observations"
          variant="cyan"
        />
        <MetricCard
          title="Mean Energy Consumption"
          value={formatKwh(data.mean_consumption_kwh)}
          subtitle={`Std Dev: ±${formatNumber(data.std_consumption_kwh)} kWh`}
          variant="purple"
        />
        <MetricCard
          title="Best-Fit Distribution"
          value={data.best_fit_distribution}
          subtitle="Optimal AIC & BIC model"
          variant="amber"
          badge="Rank #1"
        />
        <MetricCard
          title="Peak / Non-Peak Ratio"
          value={`${data.peak_to_non_peak_ratio}x`}
          subtitle={`Highest Sector: ${data.highest_consuming_sector}`}
          variant="emerald"
        />
      </div>

      <div className="card-box mt-6">
        <h3 className="card-heading">Dataset Architecture & Modeling Constraints</h3>
        <ul className="info-list">
          <li><strong>Primary Random Variable:</strong> <code>energy_consumption_kwh</code> across Tamil Nadu smart meters.</li>
          <li><strong>Spatial Domain:</strong> Stratified across synthetic districts within Tamil Nadu.</li>
          <li><strong>Data Leakage Prevention:</strong> <code>generation_event_type</code> is strictly excluded from predictive/statistical input variables.</li>
          <li><strong>Temporal Hierarchy:</strong> Hour-level diurnal resolution with seasonal and multi-year tracking (2022–2025).</li>
          <li><strong>Strict Invariance:</strong> Zero runtime refitting; parameters are served directly from validated Colab frozen artifacts stored in PostgreSQL.</li>
        </ul>
      </div>
    </div>
  );
};
