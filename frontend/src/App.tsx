import React, { useState } from 'react';
import { Sidebar } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { DatasetInfoModal } from './components/common/DatasetInfoModal';
import { SectionId, NAVIGATION_SECTIONS } from './utils/constants';

// The 4 Primary Navigation Sections
import { DashboardPage } from './pages/DashboardPage';
import { TrendsPage } from './pages/TrendsPage';
import { SectorAnalysisPage } from './pages/SectorAnalysisPage';
import { PeakDemandPage } from './pages/PeakDemandPage';

export const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SectionId>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isDataInfoOpen, setIsDataInfoOpen] = useState<boolean>(false);

  const currentSectionMeta = NAVIGATION_SECTIONS.find((sec) => sec.id === activeSection) || NAVIGATION_SECTIONS[0];

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardPage />;
      case 'trends':
        return <TrendsPage />;
      case 'sectors':
        return <SectorAnalysisPage />;
      case 'peak':
        return <PeakDemandPage />;
      default:
        return <DashboardPage />;
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
