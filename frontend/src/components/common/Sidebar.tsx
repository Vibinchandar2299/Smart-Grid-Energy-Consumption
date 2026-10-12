import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Building2,
  Zap,
  Info,
  Activity,
} from 'lucide-react';
import { NAVIGATION_SECTIONS, SectionId } from '../../utils/constants';

interface SidebarProps {
  activeSection: SectionId;
  onSelectSection: (id: SectionId) => void;
  isOpen?: boolean;
  onCloseMobile?: () => void;
  onOpenDataInfo?: () => void;
}

const iconMap = {
  LayoutDashboard,
  TrendingUp,
  Building2,
  Zap,
};

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  isOpen = false,
  onCloseMobile,
  onOpenDataInfo,
}) => {
  return (
    <aside className={`sidebar-container ${isOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-brand">
        <div className="brand-icon-box">
          <Activity className="w-5 h-5" />
        </div>
        <div className="brand-text">
          <span className="brand-name">SmartGrid Energy</span>
          <span className="brand-sub">Tamil Nadu Grid Monitor</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">MONITORING SECTIONS</div>
        {NAVIGATION_SECTIONS.map((sec) => {
          const IconComponent = iconMap[sec.icon as keyof typeof iconMap] || LayoutDashboard;
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => {
                onSelectSection(sec.id);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
              title={sec.desc}
            >
              <IconComponent className="nav-icon" />
              <span className="nav-label">{sec.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="dataset-badge-card">
          <div className="dataset-badge-title">
            <Info className="w-3.5 h-3.5 text-emerald-600" />
            <span>Dataset Information</span>
          </div>
          <p className="dataset-badge-desc">
            1,000,000 smart meter hours calibrated to Tamil Nadu grid demand patterns.
          </p>
          {onOpenDataInfo && (
            <button
              onClick={onOpenDataInfo}
              className="mt-2 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-transparent border-0 p-0 cursor-pointer block"
            >
              View Data Architecture →
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
