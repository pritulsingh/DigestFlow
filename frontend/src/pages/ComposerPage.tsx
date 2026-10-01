import React, { useState } from 'react';
import { useWeeklyDigest } from '../hooks/useWeeklyDigest';
import { WeekSelector } from '../components/digest/WeekSelector';
import { DigestHeader } from '../components/digest/DigestHeader';
import { SummarySection } from '../components/digest/SummarySection';
import { ProjectSection } from '../components/digest/ProjectSection';
import { ChangesSection } from '../components/digest/ChangesSection';
import { AttentionSection } from '../components/digest/AttentionSection';
import { DraftEditor } from '../components/digest/DraftEditor';
import { SaveStatus } from '../components/digest/SaveStatus';
import { PublishConfirmationModal } from '../components/digest/PublishConfirmationModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { EmptyState } from '../components/common/EmptyState';

export const ComposerPage: React.FC = () => {
  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);

  const {
    from,
    to,
    changePeriod,
    digest,
    changes,
    qualityIssues,
    draft,
    lastSavedDraft,
    loading,
    generatingDraft,
    saving,
    isDirty,
    error,
    statusMessage,
    handleGenerateDraft,
    updateDraftLocally,
    revertChanges,
    saveDraft,
    approveDraft,
    publishDraft,
    refetch,
  } = useWeeklyDigest();

  const handleConfirmPublish = async () => {
    setIsPublishModalOpen(false);
    await publishDraft();
  };

  const unroutedCount = qualityIssues.filter((i) => i.type === 'unrouted_signal').length;

  return (
    <div className="flex flex-col min-h-[calc(100vh-110px)] justify-between">
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Step 1: Week Selector */}
        <WeekSelector
          from={from}
          to={to}
          onPeriodChange={changePeriod}
          disabled={loading || saving || generatingDraft}
        />

        {/* Human Final Decision & Reviewer Boundary Banner */}
        <div className="bg-slate-900 text-slate-200 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between text-xs shadow-2xs">
          <div className="flex items-center space-x-3">
            <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-semibold text-[10px] tracking-wider uppercase border border-slate-700">
              POLICY
            </span>
            <div>
              <strong className="font-semibold text-white">Human Decision-Maker Required:</strong>{' '}
              <span>Deterministic local templates produce initial draft facts. Human reviewer approval is strictly required prior to publishing. Content is never published automatically.</span>
            </div>
          </div>
          {isDirty && (
            <button
              onClick={revertChanges}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-md text-[11px] border border-slate-700 transition-colors flex-shrink-0"
            >
              Revert Edits
            </button>
          )}
        </div>

        {/* Partial Data / Unrouted Signals Warning Banner */}
        {unroutedCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3.5 flex items-center justify-between text-xs font-medium shadow-2xs">
            <div className="flex items-center space-x-2.5">
              <span className="px-2 py-0.5 bg-amber-200/80 text-amber-900 rounded font-bold text-[10px] tracking-wider uppercase border border-amber-300">
                NOTICE
              </span>
              <div>
                <strong>Partial Data Warning:</strong> {unroutedCount} unrouted signal record(s) detected during this period. Unrouted signals are cataloged under Data Quality Attention and excluded from project sections until routed.
              </div>
            </div>
          </div>
        )}

        {error && (
          <ErrorMessage
            title="Digest Action Warning"
            message={error}
            onRetry={isDirty ? saveDraft : refetch}
          />
        )}

        {loading ? (
          <LoadingSpinner message="Aggregating source data through Express WeeklyDigestService..." />
        ) : digest ? (
          <>
            {/* Step 2: Digest Header & Workflow Controls */}
            <DigestHeader
              from={from}
              to={to}
              draft={draft}
              generatingDraft={generatingDraft}
              saving={saving}
              isDirty={isDirty}
              onGenerateDraft={() => handleGenerateDraft()}
              onSave={saveDraft}
              onApprove={approveDraft}
              onPublish={() => setIsPublishModalOpen(true)}
              onRevert={revertChanges}
            />

            {/* Step 3: Executive Summary Overview */}
            <SummarySection digest={digest} />

            {digest.sections.length === 0 ? (
              <EmptyState
                icon="📭"
                title="No Project Activity for Selected Period"
                description="No project activity or analyzed signals were found between the selected dates. Try selecting a different week range or generating a fresh draft."
                actionLabel="Generate Draft"
                onAction={() => handleGenerateDraft()}
              />
            ) : (
              /* Grid Layout: Left Column = Project Activity & Draft Editor, Right Column = Changes & Attention */
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Area (2 cols) */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Draft Editor Component (visible when draft exists) */}
                  {draft && (
                    <DraftEditor
                      draft={draft}
                      lastSavedDraft={lastSavedDraft}
                      onUpdateDraft={updateDraftLocally}
                      onRevert={revertChanges}
                      isDirty={isDirty}
                      disabled={saving || draft.content.status === 'published'}
                    />
                  )}

                  {/* Project Activity Sections */}
                  <ProjectSection sections={digest.sections} />
                </div>

                {/* Sidebar Area (1 col): Changes & Data Quality Attention */}
                <div className="space-y-6">
                  {/* Data Quality & Attention Section */}
                  <AttentionSection issues={qualityIssues} />

                  {/* Week-over-Week Changes Comparison */}
                  {changes && <ChangesSection changesComparison={changes} />}
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* Explicit Publish Confirmation Modal */}
      <PublishConfirmationModal
        isOpen={isPublishModalOpen}
        from={from}
        to={to}
        onConfirm={handleConfirmPublish}
        onCancel={() => setIsPublishModalOpen(false)}
        isPublishing={saving}
      />

      {/* Floating Save Status Bar */}
      <SaveStatus
        draft={draft}
        isDirty={isDirty}
        saving={saving}
        error={error}
        statusMessage={statusMessage}
        onRetrySave={saveDraft}
      />
    </div>
  );
};
