import React, { useState } from 'react';
import { useSourceData } from '../hooks/useSourceData';
import { Card } from '../components/common/Card';
import { Badge, BadgeVariant } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { EmptyState } from '../components/common/EmptyState';
import { formatDate } from '../utils/formatters';

export const SourceDataPage: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'signals' | 'projects' | 'runs'>('signals');

  const { signals, projects, runs, loading, error, refetch } = useSourceData(
    selectedProject || undefined
  );

  const getStatusBadgeVariant = (state: string): BadgeVariant => {
    const primaryState = state.split(',')[0].trim();
    switch (primaryState) {
      case 'analyzed':
      case 'success':
      case 'active':
        return 'success';
      case 'pending':
      case 'in_progress':
      case 'maintenance':
        return 'warning';
      case 'failed':
      case 'deprecated':
      case 'error':
        return 'error';
      default:
        return 'neutral';
    }
  };

  const getSignalStatusString = (status: any): string => {
    if (!status) return 'unknown';
    if (typeof status === 'string') return status;
    if (typeof status.state === 'string') return status.state;
    if (typeof status === 'object') {
      const states = Object.values(status)
        .map((val: any) => (val && typeof val === 'object' && val.state ? val.state : null))
        .filter(Boolean);
      if (states.length > 0) {
        return Array.from(new Set(states)).join(', ');
      }
    }
    return 'unknown';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header and Filter */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Source Data Inspection</h2>
          <p className="text-sm text-slate-600 mt-1">
            Read-only inspection of Signals, Projects, and Ingest Runs fetched via Express REST API (`/api/v1`).
          </p>
        </div>

        {/* Project Filter */}
        <div className="flex items-center space-x-2">
          <label htmlFor="project-filter" className="text-xs font-semibold text-slate-700">
            Project Filter:
          </label>
          <select
            id="project-filter"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="text-xs border border-slate-300 rounded-md px-3 py-1.5 bg-white text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sub Tab Buttons */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('signals')}
          className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors ${
            activeSubTab === 'signals'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Signals ({signals.length})
        </button>
        <button
          onClick={() => setActiveSubTab('projects')}
          className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors ${
            activeSubTab === 'projects'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Projects ({projects.length})
        </button>
        <button
          onClick={() => setActiveSubTab('runs')}
          className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors ${
            activeSubTab === 'runs'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Ingest Run Log ({runs.length})
        </button>
      </div>

      {loading ? (
        <LoadingSpinner message="Fetching source records from Express API..." />
      ) : error ? (
        <ErrorMessage title="Failed to load source data" message={error} onRetry={refetch} />
      ) : (
        <>
          {/* Signals SubTab */}
          {activeSubTab === 'signals' && (
            <Card title={`Signals (${signals.length} records loaded via /api/v1/signals)`}>
              {signals.length === 0 ? (
                <EmptyState
                  icon="📡"
                  title="No Signals Found"
                  description="No signal records match the selected project filter or exist in the dataset."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                        <th className="py-2.5 px-3">Signal ID</th>
                        <th className="py-2.5 px-3">Match Key</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Project / Routing</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Received At</th>
                        <th className="py-2.5 px-3">Summary / Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {signals.map((sig) => {
                        const statusStr = getSignalStatusString(sig.status);
                        const projectDisplay = sig.projects && sig.projects.length > 0
                          ? sig.projects.join(', ')
                          : (sig.routing?.project_id || 'Unrouted');
                        const dateDisplay = sig.date || sig.received_at;
                        const summaryDisplay = sig.summary || sig.notes || sig.description || 'No summary available';

                        return (
                          <tr key={sig.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-3 font-mono font-semibold text-slate-900">{sig.id}</td>
                            <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">{sig.match_key || sig.id}</td>
                            <td className="py-3 px-3 capitalize">{sig.type || 'signal'}</td>
                            <td className="py-3 px-3">
                              {projectDisplay !== 'Unrouted' ? (
                                <span className="font-semibold text-indigo-700">{projectDisplay}</span>
                              ) : (
                                <Badge variant="warning" size="sm">Unrouted</Badge>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <Badge variant={getStatusBadgeVariant(statusStr)} size="sm">
                                {statusStr}
                              </Badge>
                            </td>
                            <td className="py-3 px-3 text-slate-500">{dateDisplay ? formatDate(dateDisplay) : 'N/A'}</td>
                            <td className="py-3 px-3 max-w-xs truncate text-slate-600">
                              {summaryDisplay}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}

          {/* Projects SubTab */}
          {activeSubTab === 'projects' && (
            <Card title={`Registered Projects (${projects.length} loaded via /api/v1/projects)`}>
              {projects.length === 0 ? (
                <EmptyState
                  icon="📁"
                  title="No Projects Found"
                  description="No project records match the current filter or exist in the system."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects.map((proj) => (
                    <div key={proj.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{proj.name}</h4>
                          <span className="text-xs font-mono text-slate-500">ID: {proj.id}</span>
                        </div>
                        <Badge variant={getStatusBadgeVariant(proj.status || 'active')} size="sm">
                          {proj.status || 'active'}
                        </Badge>
                      </div>
                      {proj.description && (
                        <p className="text-xs text-slate-600">{proj.description}</p>
                      )}
                      {proj.lead && (
                        <div className="text-xs text-slate-500 pt-1">
                          <span className="font-medium text-slate-700">Lead:</span> {proj.lead}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Run Log SubTab */}
          {activeSubTab === 'runs' && (
            <Card title={`Ingest Run Log (${runs.length} entries loaded via /api/v1/runs)`}>
              {runs.length === 0 ? (
                <EmptyState
                  icon="⚙️"
                  title="No Ingest Runs Recorded"
                  description="No ingest run log records found in the dataset."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                        <th className="py-2.5 px-3">Run ID</th>
                        <th className="py-2.5 px-3">Timestamp</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Items Processed</th>
                        <th className="py-2.5 px-3">Message</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {runs.map((run, idx) => {
                        const runId = run.run ?? run.run_id ?? (idx + 1);
                        const timestamp = run.started_at || run.timestamp;
                        const status = run.status || 'success';
                        const itemsProcessed = run.summary?.signals_matched ?? run.items_processed ?? 0;
                        const message = run.error
                          ? `Error: ${run.error}`
                          : (run.message || (run.summary ? `${run.summary.signals_matched || 0} signals matched, ${run.summary.files_ingested || 0} files ingested` : 'Run completed'));

                        return (
                          <tr key={runId} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-3 font-mono font-semibold">#{runId}</td>
                            <td className="py-2.5 px-3 text-slate-500">{timestamp ? formatDate(timestamp) : 'N/A'}</td>
                            <td className="py-2.5 px-3">
                              <Badge variant={getStatusBadgeVariant(status)} size="sm">
                                {status}
                              </Badge>
                            </td>
                            <td className="py-2.5 px-3 font-mono">{itemsProcessed}</td>
                            <td className="py-2.5 px-3 text-slate-600">{message}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
};
