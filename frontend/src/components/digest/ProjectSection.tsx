import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Badge, BadgeVariant } from '../common/Badge';
import { DigestSection } from '../../types';

interface ProjectSectionProps {
  sections: DigestSection[];
}

export const ProjectSection: React.FC<ProjectSectionProps> = ({ sections }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [collapsedProjects, setCollapsedProjects] = useState<Record<string, boolean>>({});

  const toggleCollapse = (projectId: string) => {
    setCollapsedProjects((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
  };

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

  const filteredSections = sections.filter(
    (sec) => selectedProjectId === 'all' || sec.projectId === selectedProjectId
  );

  return (
    <div className="space-y-4">
      {/* Header and Filter Dropdown Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Project Activity Sections</h3>

        {sections.length > 1 && (
          <div className="flex items-center space-x-2 text-xs">
            <label htmlFor="project-filter-dropdown" className="font-semibold text-slate-600 whitespace-nowrap">
              Filter Project:
            </label>
            <select
              id="project-filter-dropdown"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="text-xs font-semibold border border-slate-300 rounded px-2.5 py-1 bg-white text-slate-800 shadow-2xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
            >
              <option value="all">All Projects ({sections.length})</option>
              {sections.map((sec) => (
                <option key={sec.projectId} value={sec.projectId}>
                  {sec.projectName || sec.title} ({sec.items.length})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {filteredSections.map((sec) => {
        const isCollapsed = collapsedProjects[sec.projectId];
        return (
          <Card
            key={sec.projectId}
            title={
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 text-base">{sec.projectName || sec.title}</span>
                <span className="text-xs font-mono font-normal text-slate-500">({sec.projectId})</span>
              </div>
            }
            action={
              <div className="flex items-center space-x-2">
                <Badge variant="info" size="sm">
                  {sec.items.length} {sec.items.length === 1 ? 'item' : 'items'}
                </Badge>
                <button
                  onClick={() => toggleCollapse(sec.projectId)}
                  className="px-2 py-0.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
                >
                  {isCollapsed ? '▲ Expand' : '▼ Collapse'}
                </button>
              </div>
            }
          >
            {sec.summary && (
              <p className="text-sm text-slate-700 bg-slate-50 border-l-4 border-indigo-500 p-3 rounded-r-md mb-3 italic">
                {sec.summary}
              </p>
            )}

            {!isCollapsed && (
              <>
                {sec.items.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2">No activity recorded for this project during the period.</p>
                ) : (
                  <div className="space-y-3">
                    {sec.items.map((item) => (
                      <div
                        key={item.id}
                        className="border border-slate-200 rounded-lg p-3.5 bg-white space-y-1.5 hover:border-slate-300 transition-colors"
                      >
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
                        <p className="text-xs text-slate-600">{item.body || item.summary}</p>
                        {item.sourceRecordRefs && item.sourceRecordRefs.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 text-[11px] text-slate-500">
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
                )}
              </>
            )}
          </Card>
        );
      })}
    </div>
  );
};
