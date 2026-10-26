import React, { useState } from 'react';
import { Sidebar } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { DatasetInfoModal } from './components/common/DatasetInfoModal';
import { SectionId, NAVIGATION_SECTIONS } from './utils/constants';

// The 4 Primary Research Application Sections
import { DashboardPage } from './pages/DashboardPage';
import { ConsumptionAnalysisPage } from './pages/ConsumptionAnalysisPage';
import { DistributionAnalysisPage } from './pages/DistributionAnalysisPage';
import { ExtremeValuePage } from './pages/ExtremeValuePage';

export const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SectionId>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isDataInfoOpen, setIsDataInfoOpen] = useState<boolean>(false);

  const currentSectionMeta =
    NAVIGATION_SECTIONS.find((sec) => sec.id === activeSection) || NAVIGATION_SECTIONS[0];

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardPage onNavigateSection={(sec) => setActiveSection(sec as SectionId)} />;
      case 'consumption':
        return <ConsumptionAnalysisPage />;
      case 'distributions':
        return <DistributionAnalysisPage />;
      case 'extreme-values':
        return <ExtremeValuePage />;
      default:
        return <DashboardPage onNavigateSection={(sec) => setActiveSection(sec as SectionId)} />;
    }
  };

  return (
    <div className="app-layout">
      {/* Sidebar with 4 primary navigation items */}
      <Sidebar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        isOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onOpenDataInfo={() => setIsDataInfoOpen(true)}
      />

      {/* Mobile Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Content Area */}
      <main className="main-content">
        <Header
          title={currentSectionMeta.label}
          subtitle={currentSectionMeta.desc}
          onToggleMobile={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onOpenDataInfo={() => setIsDataInfoOpen(true)}
        />
        {renderSection()}
      </main>

      {/* Dataset Architecture & Provenance Modal */}
      <DatasetInfoModal
        isOpen={isDataInfoOpen}
        onClose={() => setIsDataInfoOpen(false)}
      />
    </div>
  );
};

export default App;
