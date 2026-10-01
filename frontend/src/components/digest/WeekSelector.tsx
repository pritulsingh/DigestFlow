import React from 'react';

interface WeekSelectorProps {
  from: string;
  to: string;
  onPeriodChange: (from: string, to: string) => void;
  disabled?: boolean;
}

export const WeekSelector: React.FC<WeekSelectorProps> = ({
  from,
  to,
  onPeriodChange,
  disabled = false,
}) => {
  // Preset weeks based on actual signal ledger dataset entry dates
  const presetWeeks = [
    { label: 'Jul 6, 2026 – Jul 12, 2026', from: '2026-07-06', to: '2026-07-12' },
    { label: 'Jul 13, 2026 – Jul 19, 2026', from: '2026-07-13', to: '2026-07-19' },
    { label: 'Jul 20, 2026 – Jul 26, 2026', from: '2026-07-20', to: '2026-07-26' },
    { label: 'Jul 27, 2026 – Aug 2, 2026', from: '2026-07-27', to: '2026-08-02' },
  ];

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Quick Select Presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider mr-1">
          Select Period:
        </span>
        {presetWeeks.map((preset) => {
          const isSelected = from === preset.from && to === preset.to;
          return (
            <button
              key={preset.label}
              disabled={disabled}
              onClick={() => onPeriodChange(preset.from, preset.to)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-all ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
              } disabled:opacity-50`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Custom Date Inputs */}
      <div className="flex items-center space-x-2 text-xs">
        <div className="flex items-center space-x-1">
          <label htmlFor="period-from" className="text-slate-600 font-medium">From:</label>
          <input
            id="period-from"
            type="date"
            value={from}
            disabled={disabled}
            onChange={(e) => onPeriodChange(e.target.value, to)}
            className="border border-slate-300 rounded px-2 py-1 bg-white text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center space-x-1">
          <label htmlFor="period-to" className="text-slate-600 font-medium">To:</label>
          <input
            id="period-to"
            type="date"
            value={to}
            disabled={disabled}
            onChange={(e) => onPeriodChange(from, e.target.value)}
            className="border border-slate-300 rounded px-2 py-1 bg-white text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>
    </div>
  );
};
