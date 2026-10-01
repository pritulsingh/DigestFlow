import React from 'react';

interface PublishConfirmationModalProps {
  isOpen: boolean;
  from: string;
  to: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPublishing?: boolean;
}

export const PublishConfirmationModal: React.FC<PublishConfirmationModalProps> = ({
  isOpen,
  from,
  to,
  onConfirm,
  onCancel,
  isPublishing = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center space-x-3 text-purple-700">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center font-bold text-lg">
            📢
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Confirm Digest Publication</h3>
            <p className="text-xs text-slate-500">Deliberate Human Reviewer Action</p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-xs text-slate-700 space-y-2">
          <p>
            You are about to publish the Weekly Digest for period:{' '}
            <strong className="text-slate-900 font-bold">{from} &rarr; {to}</strong>.
          </p>
          <ul className="list-disc list-inside text-slate-600 space-y-1">
            <li>Digest status will transition to <span className="font-semibold text-purple-700 font-mono">PUBLISHED</span>.</li>
            <li>A permanent event will be recorded in <span className="font-mono text-slate-800">data/audit-log.jsonl</span>.</li>
            <li>Source fixture files remain 100% read-only.</li>
          </ul>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            onClick={onCancel}
            disabled={isPublishing}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPublishing}
            className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-md shadow-xs transition-colors disabled:opacity-50 flex items-center space-x-1.5"
          >
            {isPublishing ? 'Publishing...' : 'Yes, Publish Digest'}
          </button>
        </div>
      </div>
    </div>
  );
};
