import React, { useState, useMemo } from 'react';
import { Card } from '../common/Card';
import { Badge, BadgeVariant } from '../common/Badge';
import { DataQualityIssue } from '../../types';

interface AttentionSectionProps {
  issues: DataQualityIssue[];
}

export const AttentionSection: React.FC<AttentionSectionProps> = ({ issues }) => {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [limit, setLimit] = useState<number>(10);

  // Group unique issue types for dropdown selector
  const issueTypes = useMemo(() => {
    const typesMap = new Map<string, number>();
    issues.forEach((i) => {
      const typeKey = i.type || 'UNKNOWN';
      typesMap.set(typeKey, (typesMap.get(typeKey) || 0) + 1);
    });
    return Array.from(typesMap.entries());
  }, [issues]);

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (selectedType !== 'all' && issue.type !== selectedType) return false;
      if (selectedSeverity !== 'all') {
        const sev = (issue.severity || '').toLowerCase();
        if (selectedSeverity === 'error' && sev !== 'error' && sev !== 'critical' && sev !== 'high') return false;
        if (selectedSeverity === 'warning' && sev !== 'warning' && sev !== 'medium') return false;
        if (selectedSeverity === 'info' && sev !== 'info' && sev !== 'low') return false;
      }
      return true;
    });
  }, [issues, selectedType, selectedSeverity]);

  const visibleIssues = filteredIssues.slice(0, limit);

  const getSeverityVariant = (sev: string): BadgeVariant => {
    switch (sev ? sev.toLowerCase() : '') {
      case 'critical':
      case 'high':
      case 'error':
        return 'error';
      case 'medium':
      case 'warning':
        return 'warning';
      case 'low':
      case 'info':
        return 'info';
      default:
        return 'neutral';
    }
  };

  return (
    <Card
      title={
        <div className="flex items-center space-x-2">
          <span className="font-bold text-slate-900 text-base">Items Requiring Attention</span>
          <Badge variant={issues.length > 0 ? 'warning' : 'success'} size="sm">
            {issues.length} {issues.length === 1 ? 'issue' : 'issues'}
          </Badge>
        </div>
      }
      subtitle="Programmatically flagged anomalies in source fixtures requiring manual verification"
    >
      {issues.length === 0 ? (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-medium">
          ✅ All signals and projects passed data-quality validation clean with zero open issues.
        </div>
      ) : (
        <div className="space-y-3">
          {/* Controls & Dropdown Filters */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex flex-col gap-2 sm:flex-row sm:items-center justify-between text-xs">
            <div className="flex items-center space-x-1.5 flex-1">
              <label htmlFor="issue-type-filter" className="font-semibold text-slate-700 text-[11px] whitespace-nowrap">
                Type:
              </label>
              <select
                id="issue-type-filter"
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setLimit(10);
                }}
                className="w-full text-xs font-medium border border-slate-300 rounded px-2 py-1 bg-white text-slate-800 shadow-2xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
              >
                <option value="all">All Types ({issues.length})</option>
                {issueTypes.map(([type, count]) => (
                  <option key={type} value={type}>
                    {type} ({count})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-1.5">
              <label htmlFor="severity-filter" className="font-semibold text-slate-700 text-[11px] whitespace-nowrap">
                Severity:
              </label>
              <select
                id="severity-filter"
                value={selectedSeverity}
                onChange={(e) => {
                  setSelectedSeverity(e.target.value);
                  setLimit(10);
                }}
                className="text-xs font-medium border border-slate-300 rounded px-2 py-1 bg-white text-slate-800 shadow-2xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
              >
                <option value="all">All</option>
                <option value="error">Errors</option>
                <option value="warning">Warnings</option>
                <option value="info">Info</option>
              </select>
            </div>
          </div>

          {/* Fixed-Height Scrollable Issues Container */}
          <div className="max-h-[460px] overflow-y-auto space-y-3 pr-1 border-t border-slate-100 pt-2">
            {filteredIssues.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">No data quality issues match the selected filters.</p>
            ) : (
              visibleIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="border border-amber-200/90 bg-amber-50/50 rounded-lg p-3 space-y-1.5 hover:border-amber-300 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <Badge variant={getSeverityVariant(issue.severity)} size="sm">
                        {issue.severity.toUpperCase()}
                      </Badge>
                      <span className="font-mono text-[11px] font-bold text-slate-800">{issue.type}</span>
                    </div>
                    {issue.projectId && (
                      <span className="font-semibold text-[11px] text-indigo-700 font-mono">
                        Project: {issue.projectId}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-medium text-slate-900">{issue.message}</p>
                  <div className="text-[11px] text-slate-500 font-mono truncate">
                    Entity Ref: {issue.entityId}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Show More / Collapse Pagination Controls */}
          {filteredIssues.length > limit && (
            <button
              onClick={() => setLimit((prev) => prev + 15)}
              className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded border border-slate-200 transition-colors text-center"
            >
              Show More ({filteredIssues.length - limit} remaining...)
            </button>
          )}

          {limit > 10 && filteredIssues.length <= limit && (
            <button
              onClick={() => setLimit(10)}
              className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium text-xs rounded border border-slate-200 transition-colors text-center"
            >
              Collapse List
            </button>
          )}
        </div>
      )}
    </Card>
  );
};
