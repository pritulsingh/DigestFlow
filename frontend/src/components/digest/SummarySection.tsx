import React from 'react';
import { Card } from '../common/Card';
import { WeeklyDigest } from '../../types';

interface SummarySectionProps {
  digest: WeeklyDigest;
}

export const SummarySection: React.FC<SummarySectionProps> = ({ digest }) => {
  const totalItems = digest.sections.reduce((acc, sec) => acc + sec.items.length, 0);

  return (
    <Card title="Digest Overview">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Target Period</span>
          <p className="text-sm font-bold text-slate-900 mt-1">
            {digest.periodStart} &rarr; {digest.periodEnd}
          </p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Active Projects</span>
          <p className="text-sm font-bold text-indigo-600 mt-1">
            {digest.sections.length} Projects Grouped
          </p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Items</span>
          <p className="text-sm font-bold text-emerald-600 mt-1">
            {totalItems} Signals & Activity Records
          </p>
        </div>
      </div>
    </Card>
  );
};
