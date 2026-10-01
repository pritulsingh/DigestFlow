import React from 'react';

export type PageTab = 'composer' | 'overview' | 'source-data' | 'data-quality' | 'share';

interface NavigationProps {
  activeTab: PageTab;
  onTabChange: (tab: PageTab) => void;
  issuesCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  issuesCount,
}) => {
  const tabs: { id: PageTab; label: string; badge?: number }[] = [
    { id: 'composer', label: 'Weekly Digest Composer' },
    { id: 'overview', label: 'System Overview' },
    { id: 'source-data', label: 'Source Data Fixtures' },
    { id: 'data-quality', label: 'Data Quality Inspection', badge: issuesCount },
  ];

  if (activeTab === 'share') {
    tabs.push({ id: 'share', label: '🔗 Shared Digest View' });
  }

  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`py-3.5 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`ml-1.5 px-2 py-0.5 text-xs rounded-full font-semibold ${
                      isActive
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
