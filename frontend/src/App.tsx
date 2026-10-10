import React, { useState } from 'react';
import { Sidebar } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { SectionId } from './utils/constants';

// 8 Dedicated Research Section Pages
import { OverviewPage } from './pages/OverviewPage';
import { DistributionAnalysisPage } from './pages/DistributionAnalysisPage';
import { SectorAnalysisPage } from './pages/SectorAnalysisPage';
import { PeakVsNonPeakPage } from './pages/PeakVsNonPeakPage';
import { SeasonalAnalysisPage } from './pages/SeasonalAnalysisPage';
import { HourlyAnalysisPage } from './pages/HourlyAnalysisPage';
import { TemporalShiftPage } from './pages/TemporalShiftPage';
import { ExtremeValuePage } from './pages/ExtremeValuePage';

export const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SectionId>('overview');

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return <OverviewPage />;
      case 'distributions':
        return <DistributionAnalysisPage />;
      case 'sectors':
        return <SectorAnalysisPage />;
      case 'peak':
        return <PeakVsNonPeakPage />;
      case 'seasonal':
        return <SeasonalAnalysisPage />;
      case 'hourly':
        return <HourlyAnalysisPage />;
      case 'temporal-shift':
        return <TemporalShiftPage />;
      case 'extreme-values':
        return <ExtremeValuePage />;
      default:
        return <OverviewPage />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar activeSection={activeSection} onSelectSection={setActiveSection} />
      <main className="main-content">
        <Header />
        {renderSection()}
      </main>
    </div>
  );
};

export default App;
