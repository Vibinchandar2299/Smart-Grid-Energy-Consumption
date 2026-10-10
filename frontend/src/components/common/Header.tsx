import React from 'react';
import { Activity, Database, CheckCircle2 } from 'lucide-react';
import { RESEARCH_TITLE } from '../../utils/constants';

export const Header: React.FC = () => {
  return (
    <header className="header-container">
      <div className="header-left">
        <div className="badge-cluster">
          <span className="system-badge badge-primary">
            <Activity className="icon-sm" /> Tamil Nadu Smart Grid
          </span>
          <span className="system-badge badge-success">
            <CheckCircle2 className="icon-sm" /> Google Colab Validated
          </span>
          <span className="system-badge badge-neutral">
            <Database className="icon-sm" /> PostgreSQL Frozen Layer
          </span>
        </div>
        <h1 className="header-title">{RESEARCH_TITLE}</h1>
        <p className="header-subtitle">
          Empirical probability modeling & goodness-of-fit benchmarking for smart grid operational resilience
        </p>
      </div>
    </header>
  );
};
