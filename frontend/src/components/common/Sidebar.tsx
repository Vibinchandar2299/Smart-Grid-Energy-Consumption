import React from 'react';
import {
  LayoutDashboard,
  BarChart3,
  Building2,
  Zap,
  Sun,
  Clock,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { NAVIGATION_SECTIONS, SectionId } from '../../utils/constants';

interface SidebarProps {
  activeSection: SectionId;
  onSelectSection: (id: SectionId) => void;
}

const iconMap = {
  LayoutDashboard,
  BarChart3,
  Building2,
  Zap,
  Sun,
  Clock,
  TrendingUp,
  AlertTriangle,
};

export const Sidebar: React.FC<SidebarProps> = ({ activeSection, onSelectSection }) => {
  return (
    <aside className="sidebar-container">
      <div className="sidebar-brand">
        <span className="brand-dot"></span>
        <div className="brand-text">
          <span className="brand-name">GRID-STAT-AI</span>
          <span className="brand-sub">Research Dashboard</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">RESEARCH SECTIONS</div>
        {NAVIGATION_SECTIONS.map((sec) => {
          const IconComponent = iconMap[sec.icon as keyof typeof iconMap] || LayoutDashboard;
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => onSelectSection(sec.id)}
              className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
            >
              <IconComponent className="nav-icon" />
              <span className="nav-label">{sec.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="model-notice">
          <div className="notice-dot"></div>
          <div>
            <div className="notice-title">Inference Engine</div>
            <div className="notice-desc">Non-Refitting Zero-Leakage Architecture</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
