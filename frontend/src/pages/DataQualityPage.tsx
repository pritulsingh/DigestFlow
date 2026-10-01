import React, { useState } from 'react';
import { useDataQuality } from '../hooks/useDataQuality';
import { Card } from '../components/common/Card';
import { Badge, BadgeVariant } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { EmptyState } from '../components/common/EmptyState';

export const DataQualityPage: React.FC = () => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const { issues, loading, error, refetch } = useDataQuality();

  const getSeverityBadgeVariant = (severity: string): BadgeVariant => {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'neutral';
    }
  };

  const filteredIssues = selectedSeverity === 'all'
    ? issues
    : issues.filter((i) => i.severity === selectedSeverity);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Data Quality Inspection</h2>
          <p className="text-sm text-slate-600 mt-1">
            Programmatically detected fixture anomalies surfaced via Express REST API (`/api/v1/data-quality`).
          </p>
        </div>

        {/* Severity Filter */}
        <div className="flex items-center space-x-2">
          <label htmlFor="severity-filter" className="text-xs font-semibold text-slate-700">
            Severity:
          </label>
          <select
            id="severity-filter"
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="text-xs border border-slate-300 rounded-md px-3 py-1.5 bg-white text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Severities ({issues.length})</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Inspecting fixture records via Express DataQualityService..." />
      ) : error ? (
        <ErrorMessage title="Data Quality Inspection Failed" message={error} onRetry={refetch} />
      ) : (
        <Card
          title={`Detected Issues (${filteredIssues.length} displayed)`}
          action={
            <button
              onClick={refetch}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
            >
              Re-scan Fixtures
            </button>
          }
        >
          {filteredIssues.length === 0 ? (
            <EmptyState
              icon="✅"
              title="No Data Quality Issues Found"
              description={
                selectedSeverity === 'all'
                  ? 'All detector rules and fixture assertions passed cleanly with zero anomaly flags.'
                  : `No data quality issues found for severity level "${selectedSeverity}".`
              }
            />
          ) : (
            <div className="space-y-4">
              {filteredIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="border border-slate-200 rounded-lg p-4 bg-white shadow-xs hover:border-slate-300 transition-colors space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      <Badge variant={getSeverityBadgeVariant(issue.severity)} size="sm">
                        {issue.severity.toUpperCase()}
                      </Badge>
                      <span className="font-mono text-xs font-bold text-slate-800">{issue.type}</span>
                    </div>
                    <span className="font-mono text-xs text-slate-400">ID: {issue.id}</span>
                  </div>

                  <p className="text-sm font-medium text-slate-800">{issue.message}</p>

                  <div className="flex flex-wrap gap-4 text-xs text-slate-500 pt-1 border-t border-slate-100">
                    <div>
                      <span className="font-semibold text-slate-700">Entity ID:</span>{' '}
                      <span className="font-mono text-slate-800">{issue.entityId}</span>
                    </div>
                    {issue.projectId && (
                      <div>
                        <span className="font-semibold text-slate-700">Project:</span>{' '}
                        <span className="font-semibold text-indigo-600">{issue.projectId}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
