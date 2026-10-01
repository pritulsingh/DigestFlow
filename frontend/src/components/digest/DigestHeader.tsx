import React from 'react';
import { Badge, BadgeVariant } from '../common/Badge';
import { Draft } from '../../types';

interface DigestHeaderProps {
  from: string;
  to: string;
  draft: Draft | null;
  generatingDraft: boolean;
  saving: boolean;
  isDirty: boolean;
  onGenerateDraft: () => void;
  onSave: () => void;
  onApprove: () => void;
  onPublish: () => void;
  onRevert?: () => void;
  onViewShare?: (draftId: string) => void;
}

export const DigestHeader: React.FC<DigestHeaderProps> = ({
  from,
  to,
  draft,
  generatingDraft,
  saving,
  isDirty,
  onGenerateDraft,
  onSave,
  onApprove,
  onPublish,
  onRevert,
  onViewShare,
}) => {
  const getStatusVariant = (status?: string): BadgeVariant => {
    switch (status) {
      case 'published':
        return 'success';
      case 'approved':
        return 'info';
      case 'draft':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  const status = draft?.content?.status || 'preview';

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div className="flex items-center space-x-3 flex-wrap gap-y-2">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Weekly Digest: {from} &rarr; {to}
          </h2>
          <Badge variant={getStatusVariant(status)}>
            {status.toUpperCase()}
          </Badge>
          {draft?.isApproved ? (
            <Badge variant="success" size="sm">
              ✓ HUMAN APPROVED
            </Badge>
          ) : draft ? (
            <Badge variant="warning" size="sm">
              REQUIRES HUMAN REVIEW
            </Badge>
          ) : null}
          {isDirty && (
            <Badge variant="error" size="sm">
              UNSAVED EDITS
            </Badge>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-1">
          {draft
            ? `Draft ID: ${draft.id} • Version ${draft.version} • Human Decision Maker Required`
            : 'Previewing server-side aggregated source records'}
        </p>
      </div>

      {/* Workflow Action Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {!draft ? (
          <button
            onClick={onGenerateDraft}
            disabled={generatingDraft}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-md shadow-xs transition-colors disabled:opacity-50 flex items-center space-x-1.5"
          >
            {generatingDraft ? 'Generating Draft...' : 'Generate Draft Text'}
          </button>
        ) : (
          <>
            {draft.content.status === 'published' && onViewShare && (
              <button
                onClick={() => onViewShare(draft.id)}
                className="px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs rounded-md shadow-xs transition-colors flex items-center space-x-1"
              >
                <span>🔗 View Shareable Digest</span>
              </button>
            )}

            <button
              onClick={onSave}
              disabled={saving || !isDirty}
              className={`px-3.5 py-2 font-medium text-xs rounded-md transition-colors ${
                isDirty
                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              {saving ? 'Saving...' : isDirty ? 'Save Draft' : 'Saved'}
            </button>

            {onRevert && isDirty && (
              <button
                onClick={onRevert}
                disabled={saving}
                className="px-3 py-2 text-slate-700 hover:text-slate-900 font-medium text-xs border border-slate-300 rounded-md transition-colors hover:bg-slate-100"
              >
                Revert Changes
              </button>
            )}

            {!draft.isApproved && (
              <button
                onClick={onApprove}
                disabled={saving}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-md shadow-xs transition-colors disabled:opacity-50"
              >
                Approve Draft
              </button>
            )}

            {draft.isApproved && draft.content.status !== 'published' && (
              <button
                onClick={onPublish}
                disabled={saving}
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs rounded-md shadow-xs transition-colors disabled:opacity-50"
              >
                Publish Digest
              </button>
            )}

            <button
              onClick={onGenerateDraft}
              disabled={generatingDraft || saving}
              className="px-3 py-2 text-slate-600 hover:text-slate-900 font-medium text-xs border border-slate-300 rounded-md transition-colors hover:bg-slate-50"
            >
              Regenerate
            </button>
          </>
        )}
      </div>
    </div>
  );
};
