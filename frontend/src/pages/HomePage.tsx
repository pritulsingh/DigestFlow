import React from 'react';
import { useHealthCheck } from '../hooks/useHealthCheck';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';

export const HomePage: React.FC = () => {
  const { health, systemInfo, loading, error, refetch } = useHealthCheck();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">System Overview & API Health</h2>
        <p className="text-sm text-slate-600 mt-1">
          Express REST API connectivity, environment configuration, and server-side fixture integrity status.
        </p>
      </div>

      {loading ? (
        <LoadingSpinner message="Connecting to Express REST API..." />
      ) : error ? (
        <ErrorMessage
          title="Backend Connection Failed"
          message={error}
          onRetry={refetch}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Express Backend Card */}
          <Card
            title="Express Backend API"
            action={
              <Badge variant={health?.status === 'healthy' ? 'success' : 'warning'}>
                {health?.status || 'Unknown'}
              </Badge>
            }
          >
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="font-medium text-slate-900">Service:</span>
                <span className="font-mono text-xs">{health?.service}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="font-medium text-slate-900">Version:</span>
                <span className="font-mono text-xs">{health?.version}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="font-medium text-slate-900">Environment:</span>
                <span className="capitalize text-xs font-semibold text-indigo-600">
                  {systemInfo?.environment || 'development'}
                </span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="font-medium text-slate-900">Last Checked:</span>
                <span className="text-xs text-slate-500">
                  {health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : 'N/A'}
                </span>
              </div>
            </div>
          </Card>

          {/* Server Fixture Files Availability */}
          <Card
            title="Server Fixture Files"
            subtitle="Validated by Express Fixture Inspection Service"
          >
            {systemInfo?.fixturesStatus ? (
              <div className="space-y-2.5 text-sm">
                {Object.entries(systemInfo.fixturesStatus).map(([name, exists]) => (
                  <div key={name} className="flex justify-between items-center pb-1.5 border-b border-slate-100 last:border-none">
                    <span className="font-mono text-xs text-slate-700">{name}</span>
                    <Badge variant={exists ? 'success' : 'error'} size="sm">
                      {exists ? 'Available' : 'Missing'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">Fixture status unavailable</p>
            )}
          </Card>

          {/* Architecture Rules Card */}
          <Card
            title="Architectural Boundary Rules"
            subtitle="Strict frontend-backend decoupling"
          >
            <ul className="text-xs text-slate-600 space-y-2.5 list-disc list-inside">
              <li><strong className="text-slate-800">REST API Only:</strong> All data loaded via Express REST endpoints (`/api/v1`).</li>
              <li><strong className="text-slate-800">Zero Fixture Imports:</strong> Frontend never imports JSON fixtures or accesses `/data`.</li>
              <li><strong className="text-slate-800">No Redux/MobX:</strong> Clean React state and custom hooks.</li>
              <li><strong className="text-slate-800">Atomic Appends:</strong> Persistence uses safe atomic writes & JSONL appends.</li>
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
};
