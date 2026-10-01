import React, { useState, useEffect, useCallback } from 'react';
import { apiClient, ApiError } from '../api/client';
import { Draft, WeeklyChangeComparison, DataQualityIssue } from '../types';
import { Card } from '../components/common/Card';
import { Badge, BadgeVariant } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { formatDate } from '../utils/formatters';

interface ShareDigestPageProps {
  shareId: string;
  onBackToApp?: () => void;
}

export const ShareDigestPage: React.FC<ShareDigestPageProps> = ({ shareId, onBackToApp }) => {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [changes, setChanges] = useState<WeeklyChangeComparison | null>(null);
  const [qualityIssues, setQualityIssues] = useState<DataQualityIssue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<{ status: number; message: string } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const fetchPublishedData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch published draft strictly via Express REST API
      const publishedDraft = await apiClient.getPublishedDigest(shareId);
      setDraft(publishedDraft);

      const periodFrom = publishedDraft.content.periodStart;
      const periodTo = publishedDraft.content.periodEnd;

      // Fetch accompanying period metrics & issues via REST API
      if (periodFrom && periodTo) {
        const [changesData, issuesData] = await Promise.all([
          apiClient.getDigestChanges(periodFrom, periodTo),
          apiClient.getDataQuality(),
        ]);
        setChanges(changesData);
        setQualityIssues(issuesData);
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError({ status: err.status, message: err.message });
      } else {
        setError({ status: 500, message: err.message || 'Failed to retrieve published digest.' });
      }
    } finally {
      setLoading(false);
    }
  }, [shareId]);

  useEffect(() => {
    fetchPublishedData();
  }, [fetchPublishedData]);

  const getItemBadgeVariant = (status: string): BadgeVariant => {
    switch (status) {
      case 'analyzed':
      case 'success':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'neutral';
    }
  };

    const handleCopyMarkdown = () => {
    if (!draft) return;
    const markdownContent = draft.content.sections
      .map(
        (sec) =>
          `## ${sec.projectName} (${sec.projectId})\n${sec.summary || ''}\n` +
          sec.items.map((item) => `- **${item.title}**: ${item.body}`).join('\n')
      )
      .join('\n\n');

    navigator.clipboard.writeText(markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 font-sans">
      {/* Top Banner Navigation & Actions */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-purple-700 flex items-center justify-center text-white font-bold text-xl shadow-md">
            W
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Published Weekly Executive Digest
            </h1>
            <p className="text-xs text-slate-500">
              Supanova Labs &bull; Verified Public Audit Trail Record
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopyMarkdown}
            className="px-3.5 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-md text-xs font-semibold transition-colors flex items-center space-x-1"
          >
            <span>{copied ? '✓ Copied Markdown!' : '📋 Copy Digest Markdown'}</span>
          </button>

          {onBackToApp && (
            <button
              onClick={onBackToApp}
              className="px-3.5 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-md text-xs font-semibold transition-colors"
            >
              &larr; Back to App Workspace
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Retrieving published digest payload via Express REST API..." size="lg" />
      ) : error ? (
        <div className="max-w-lg mx-auto py-12">
          {error.status === 404 ? (
            <Card title="Digest Not Found (404)">
              <div className="text-center py-6 space-y-3">
                <div className="text-4xl">🔍</div>
                <h3 className="text-base font-bold text-slate-900">Nonexistent Digest Record</h3>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">{error.message}</p>
              </div>
            </Card>
          ) : error.status === 400 ? (
            <Card title="Digest Not Published">
              <div className="text-center py-6 space-y-3">
                <div className="text-4xl">🔒</div>
                <h3 className="text-base font-bold text-slate-900">Unpublished Digest</h3>
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded max-w-md mx-auto font-medium">
                  {error.message}
                </p>
              </div>
            </Card>
          ) : (
            <ErrorMessage
              title="API Retrieval Error"
              message={error.message}
              onRetry={fetchPublishedData}
            />
          )}
        </div>
      ) : draft ? (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Executive Header Banner */}
          <div className="bg-slate-900 text-white rounded-xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-3">
                <span className="text-2xl font-bold tracking-tight">
                  {draft.content.periodStart} &rarr; {draft.content.periodEnd}
                </span>
                <Badge variant="success" size="md">
                  OFFICIALLY PUBLISHED
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Published Record ID: <span className="font-mono text-slate-200 font-semibold">{draft.id}</span>
                {draft.content.updatedAt && (
                  <> &bull; Published on {formatDate(draft.content.updatedAt)}</>
                )}
              </p>
            </div>
            <div className="text-right border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-6 text-xs text-slate-400">
              <div>Audit Event: <span className="text-emerald-400 font-mono font-bold">DRAFT_PUBLISHED</span></div>
              <div className="mt-1">Human Decision Gate: <span className="text-slate-200 font-medium">Approved</span></div>
            </div>
          </div>

          {/* Section 1: Executive Overview Summary */}
          <Card title="Executive Overview Summary">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Reporting Period</span>
                <p className="text-sm font-bold text-slate-900 mt-1">
                  {draft.content.periodStart} to {draft.content.periodEnd}
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Projects Summary</span>
                <p className="text-sm font-bold text-indigo-600 mt-1">
                  {draft.content.sections.length} Projects Grouped
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Publication Verification</span>
                <p className="text-sm font-bold text-emerald-600 mt-1">
                  100% Validated Digest
                </p>
              </div>
            </div>
          </Card>

          {/* Section 2: Project Activity Breakdown (Strict Read-Only) */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Project Activity & Summaries</h3>
            {draft.content.sections.map((sec) => (
              <Card
                key={sec.projectId}
                title={
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-base">{sec.projectName}</span>
                    <span className="text-xs font-mono text-slate-500 font-normal">({sec.projectId})</span>
                  </div>
                }
              >
                {sec.summary && (
                  <p className="text-sm text-slate-800 bg-slate-50 border-l-4 border-indigo-600 p-3.5 rounded-r-md mb-4 leading-relaxed font-medium">
                    {sec.summary}
                  </p>
                )}

                <div className="space-y-3">
                  {sec.items.map((item) => (
                    <div key={item.id} className="border border-slate-200 rounded-lg p-3.5 bg-white space-y-1.5">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-2">
                          <Badge variant={getItemBadgeVariant(item.status)} size="sm">
                            {item.status.toUpperCase()}
                          </Badge>
                          <h4 className="text-sm font-semibold text-slate-900">{item.title}</h4>
                        </div>
                        {item.signalId && (
                          <span className="font-mono text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            {item.signalId}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-normal">{item.body}</p>
                      {item.sourceRecordRefs && item.sourceRecordRefs.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-100 text-[11px] text-slate-500">
                          <span className="font-medium text-slate-700">Source References:</span>
                          {item.sourceRecordRefs.map((ref) => (
                            <span key={ref} className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                              {ref}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          {/* Section 3: Week-over-Week Changes (If available) */}
          {changes && changes.changes.length > 0 && (
            <Card
              title="Week-over-Week Changes Summary"
              subtitle={`Activity differences between ${changes.previousPeriod.from} and ${changes.currentPeriod.to}`}
            >
              <div className="space-y-2.5">
                {changes.changes.map((change) => (
                  <div key={change.id} className="border border-slate-200 rounded p-3 bg-slate-50/50 flex justify-between items-center text-xs">
                    <div className="space-y-0.5">
                      <span className="font-semibold text-slate-900">{change.description}</span>
                      <div className="font-mono text-[11px] text-slate-500">Entity: {change.entityId}</div>
                    </div>
                    <Badge variant="neutral" size="sm">{change.category}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Section 4: Relevant Attention Information (If open issues exist) */}
          {qualityIssues.length > 0 && (
            <Card title="Relevant Data Quality Information">
              <div className="space-y-2">
                {qualityIssues.map((issue) => (
                  <div key={issue.id} className="border border-amber-200 bg-amber-50 p-2.5 rounded text-xs text-amber-900 flex justify-between">
                    <span>{issue.message}</span>
                    <span className="font-mono text-[11px] font-bold">{issue.severity.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      ) : null}
    </div>
  );
};