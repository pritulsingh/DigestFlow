import React, { useState, useEffect } from 'react';
import { Header } from './components/common/Header';
import { Navigation, PageTab } from './components/common/Navigation';
import { ComposerPage } from './pages/ComposerPage';
import { HomePage } from './pages/HomePage';
import { SourceDataPage } from './pages/SourceDataPage';
import { DataQualityPage } from './pages/DataQualityPage';
import { ShareDigestPage } from './pages/ShareDigestPage';
import { useHealthCheck } from './hooks/useHealthCheck';
import { useDataQuality } from './hooks/useDataQuality';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PageTab>('composer');
  const [shareId, setShareId] = useState<string | null>(null);
  const { health } = useHealthCheck();
  const { issues } = useDataQuality();

  const isHealthy = health?.status === 'healthy';

  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/share/')) {
      const id = path.replace('/share/', '');
      if (id) setShareId(id);
    }
  }, []);

  const handleTabChange = (tab: PageTab) => {
    setShareId(null);
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Application Header */}
      <Header isHealthy={isHealthy} />

      {/* Tab Navigation */}
      <Navigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        issuesCount={issues.length}
      />

      {/* Main Content View */}
      <main className="flex-1">
        {shareId ? (
          <ShareDigestPage shareId={shareId} onBackToApp={() => setShareId(null)} />
        ) : (
          <>
            {activeTab === 'composer' && <ComposerPage onViewShare={(id) => setShareId(id)} />}
            {activeTab === 'overview' && <HomePage />}
            {activeTab === 'source-data' && <SourceDataPage />}
            {activeTab === 'data-quality' && <DataQualityPage />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        Weekly Digest Composer &copy; 2026 Supanova Labs &bull; React + TypeScript + Express REST Foundation
      </footer>
    </div>
  );
};

export default App;

