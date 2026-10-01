import React from 'react';

interface HeaderProps {
  isHealthy?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ isHealthy = true }) => {
  return (
    <header className="bg-slate-900 text-white shadow-xs border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-slate-100 shadow-2xs">
            WD
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white leading-none">Weekly Digest Composer</h1>
            <p className="text-[11px] text-slate-400 mt-0.5">Internal Operations Platform &bull; Supanova Labs</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span
            className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
              isHealthy
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
                : 'bg-rose-950/60 text-rose-300 border-rose-800/80'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${isHealthy ? 'bg-emerald-400' : 'bg-rose-500'}`}
            />
            <span>{isHealthy ? 'REST API Connected' : 'API Offline'}</span>
          </span>
        </div>
      </div>
    </header>
  );
};


