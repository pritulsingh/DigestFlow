import React from 'react';
import { Draft } from '../../types';

interface SaveStatusProps {
  draft: Draft | null;
  isDirty: boolean;
  saving: boolean;
  error?: string | null;
  statusMessage?: string | null;
  onRetrySave?: () => void;
}

export const SaveStatus: React.FC<SaveStatusProps> = ({
  draft,
  isDirty,
  saving,
  error,
  statusMessage,
  onRetrySave,
}) => {
  if (!draft) return null;

  return (
    <div className="bg-slate-900 text-slate-200 border-t border-slate-800 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between text-xs space-y-1 sm:space-y-0">
      <div className="flex items-center space-x-2">
        <span
          className={`w-2.5 h-2.5 rounded-full ${
            error
              ? 'bg-rose-500'
              : saving
              ? 'bg-amber-400'
              : isDirty
              ? 'bg-amber-500'
              : draft.content.status === 'published'
              ? 'bg-purple-400'
              : draft.isApproved
              ? 'bg-emerald-400'
              : 'bg-indigo-400'
          }`}
        />
        <span className="font-medium">
          {error ? (
            <span className="text-rose-400 font-semibold">Save Failed — Edits Preserved in Memory</span>
          ) : saving ? (
            'Saving draft changes to server...'
          ) : isDirty ? (
            'Unsaved draft edits (click Save Draft)'
          ) : draft.content.status === 'published' ? (
            'Digest Published to Audit Trail'
          ) : draft.isApproved ? (
            'Draft Approved by Human Reviewer'
          ) : (
            'Draft Saved to data/drafts.json'
          )}
        </span>
      </div>

      <div className="flex items-center space-x-4 text-slate-400">
        {error && onRetrySave && (
          <button
            onClick={onRetrySave}
            className="px-2 py-0.5 bg-rose-700 hover:bg-rose-800 text-white rounded text-[11px] font-semibold transition-colors"
          >
            Retry Save
          </button>
        )}
        {!error && statusMessage && (
          <span className="text-emerald-400 font-mono text-[11px] truncate max-w-xs">{statusMessage}</span>
        )}
        {draft.content.updatedAt && (
          <span>Last Updated: {new Date(draft.content.updatedAt).toLocaleTimeString()}</span>
        )}
      </div>
    </div>
  );
};
