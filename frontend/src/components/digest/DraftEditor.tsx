import React from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Draft, DigestSection, DigestItem } from '../../types';

interface DraftEditorProps {
  draft: Draft;
  lastSavedDraft?: Draft | null;
  onUpdateDraft: (updated: Draft) => void;
  onRevert?: () => void;
  isDirty?: boolean;
  disabled?: boolean;
}

export const DraftEditor: React.FC<DraftEditorProps> = ({
  draft,
  lastSavedDraft,
  onUpdateDraft,
  onRevert,
  isDirty = false,
  disabled = false,
}) => {
  // Helper to check if a section's summary was modified from last saved or initial state
  const isSectionModified = (projectId: string, currentSummary: string): boolean => {
    if (!lastSavedDraft) return false;
    const lastSec = lastSavedDraft.content.sections.find((s) => s.projectId === projectId);
    return lastSec ? lastSec.summary !== currentSummary : false;
  };

  // Helper to check if an item's title or body was modified
  const isItemModified = (projectId: string, itemId: string, currentTitle: string, currentBody: string): boolean => {
    if (!lastSavedDraft) return false;
    const lastSec = lastSavedDraft.content.sections.find((s) => s.projectId === projectId);
    if (!lastSec) return false;
    const lastItem = lastSec.items.find((i) => i.id === itemId);
    return lastItem ? lastItem.title !== currentTitle || lastItem.body !== currentBody : false;
  };

  const handleSectionSummaryChange = (sectionIdx: number, newSummary: string) => {
    const newSections = draft.content.sections.map((sec, idx) => {
      if (idx !== sectionIdx) return sec;
      return { ...sec, summary: newSummary };
    });

    onUpdateDraft({
      ...draft,
      content: {
        ...draft.content,
        sections: newSections,
        updatedAt: new Date().toISOString(),
      },
    });
  };

  const handleItemTitleChange = (sectionIdx: number, itemIdx: number, newTitle: string) => {
    const newSections = draft.content.sections.map((sec, sIdx) => {
      if (sIdx !== sectionIdx) return sec;
      const newItems = sec.items.map((item, iIdx) => {
        if (iIdx !== itemIdx) return item;
        return { ...item, title: newTitle };
      });
      return { ...sec, items: newItems };
    });

    onUpdateDraft({
      ...draft,
      content: {
        ...draft.content,
        sections: newSections,
        updatedAt: new Date().toISOString(),
      },
    });
  };

  const handleItemBodyChange = (sectionIdx: number, itemIdx: number, newBody: string) => {
    const newSections = draft.content.sections.map((sec, sIdx) => {
      if (sIdx !== sectionIdx) return sec;
      const newItems = sec.items.map((item, iIdx) => {
        if (iIdx !== itemIdx) return item;
        return { ...item, body: newBody, summary: newBody };
      });
      return { ...sec, items: newItems };
    });

    onUpdateDraft({
      ...draft,
      content: {
        ...draft.content,
        sections: newSections,
        updatedAt: new Date().toISOString(),
      },
    });
  };

  // Calculate total draft length statistics
  const totalChars = draft.content.sections.reduce((acc, sec) => {
    let count = (sec.summary || '').length;
    sec.items.forEach((i) => {
      count += (i.title || '').length + (i.body || '').length;
    });
    return acc + count;
  }, 0);

  const totalWords = draft.content.sections.reduce((acc, sec) => {
    let text = (sec.summary || '') + ' ';
    sec.items.forEach((i) => {
      text += (i.title || '') + ' ' + (i.body || '') + ' ';
    });
    return acc + (text.trim() ? text.trim().split(/\s+/).length : 0);
  }, 0);

    // Intercept Ctrl+S / Cmd+S key combinations inside textareas
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      const saveButton = document.getElementById('save-draft-btn');
      if (saveButton) {
        saveButton.click();
      }
    }
  };

  return (
    <Card
      title={
        <div className="flex items-center space-x-2">
          <span className="font-bold text-slate-900 text-base">Review & Edit Draft Content</span>
          <span className="text-xs font-mono font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            {totalChars} chars &bull; {totalWords} words
          </span>
          {isDirty && <Badge variant="warning" size="sm">Unsaved Changes</Badge>}
        </div>
      }
      subtitle="Refine deterministic local draft copy prior to human approval and publishing"
      action={
        onRevert && isDirty ? (
          <button
            onClick={onRevert}
            disabled={disabled}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded transition-colors"
          >
            ↺ Discard / Revert Edits
          </button>
        ) : undefined
      }
    >
      <div className="space-y-6">
        {draft.content.sections.map((sec: DigestSection, sIdx: number) => {
          const secModified = isSectionModified(sec.projectId, sec.summary || '');
          return (
            <div key={sec.projectId} className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <div className="flex items-center space-x-2">
                  <h4 className="font-bold text-slate-900 text-sm">
                    Project: {sec.projectName || sec.title} <span className="text-xs text-slate-500 font-mono">({sec.projectId})</span>
                  </h4>
                  {secModified && (
                    <Badge variant="info" size="sm">
                      Modified by Reviewer
                    </Badge>
                  )}
                </div>
              </div>

              {/* Section Summary Editor */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label htmlFor={`sec-summary-${sec.projectId}`} className="text-xs font-semibold text-slate-700">
                    Section Executive Summary:
                  </label>
                  {secModified && (
                    <span className="text-[11px] text-indigo-600 font-medium">Customized Summary</span>
                  )}
                </div>
                <textarea
                  id={`sec-summary-${sec.projectId}`}
                  rows={2}
                  disabled={disabled}
                  value={sec.summary || ''}
                  onChange={(e) => handleSectionSummaryChange(sIdx, e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={`w-full text-xs border rounded p-2.5 bg-white text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 ${
                    secModified ? 'border-indigo-400 ring-1 ring-indigo-200' : 'border-slate-300'
                  }`}
                />
              </div>

              {/* Line Items Editor */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Section Items ({sec.items.length}):
                </span>
                {sec.items.map((item: DigestItem, iIdx: number) => {
                  const currentItemBody = item.body || item.summary || '';
                  const itemModified = isItemModified(sec.projectId, item.id, item.title, currentItemBody);
                  return (
                    <div
                      key={item.id}
                      className={`bg-white border rounded p-3 space-y-2 transition-all ${
                        itemModified ? 'border-indigo-400 shadow-xs' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex justify-between items-center space-x-2">
                        <div className="flex items-center space-x-2 flex-1">
                          <span className="text-xs font-semibold text-slate-600">Item Title:</span>
                          <input
                            type="text"
                            disabled={disabled}
                            value={item.title}
                            onChange={(e) => handleItemTitleChange(sIdx, iIdx, e.target.value)}
                            className="flex-1 text-xs font-semibold border border-slate-300 rounded px-2 py-1 bg-white text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                          />
                        </div>
                        {itemModified && (
                          <Badge variant="info" size="sm">
                            Edited Item
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-slate-500">Body Content:</span>
                        <textarea
                          rows={2}
                          disabled={disabled}
                          value={currentItemBody}
                          onChange={(e) => handleItemBodyChange(sIdx, iIdx, e.target.value)}
                          onKeyDown={handleKeyDown}
                          className="w-full text-xs border border-slate-300 rounded p-2 bg-white text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};