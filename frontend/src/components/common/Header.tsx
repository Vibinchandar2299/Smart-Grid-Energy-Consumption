import React from 'react';
import { Menu, Info, Database } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onToggleMobile?: () => void;
  onOpenDataInfo?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onToggleMobile,
  onOpenDataInfo,
}) => {
  return (
    <header className="header-container">
      <div className="header-left">
        {onToggleMobile && (
          <button
            onClick={onToggleMobile}
            className="mobile-menu-btn"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="header-title-block">
          <h1 className="header-section-name">{title}</h1>
          <span className="header-badge">
            <Database className="w-3.5 h-3.5" />
            1,000,000 Meter Hours
          </span>
        </div>
      </div>

      <div className="header-right">
        <div className="status-pill" title="Calibrated synthetic grid demand observations">
          <span className="status-dot"></span>
          <span>Historical Horizon: 2015–2024</span>
        </div>

        {onOpenDataInfo && (
          <button
            onClick={onOpenDataInfo}
            className="tab-pill tab-pill-active"
            title="Inspect dataset architecture and disclosures"
          >
            <Info className="w-3.5 h-3.5 text-emerald-600" />
            <span>Dataset Info</span>
          </button>
        )}
      </div>
    </header>
  );
};
