import React, { useState, useMemo } from 'react';
import { Card } from '../common/Card';
import { Badge, BadgeVariant } from '../common/Badge';
import { WeeklyChangeComparison } from '../../types';

interface ChangesSectionProps {
  changesComparison: WeeklyChangeComparison;
}

export const ChangesSection: React.FC<ChangesSectionProps> = ({ changesComparison }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [limit, setLimit] = useState<number>(8);

  const currentFrom = changesComparison.currentPeriod.from || changesComparison.currentPeriod.start || '';
  const currentTo = changesComparison.currentPeriod.to || changesComparison.currentPeriod.end || '';
  const prevFrom = changesComparison.previousPeriod.from || changesComparison.previousPeriod.start || '';
  const prevTo = changesComparison.previousPeriod.to || changesComparison.previousPeriod.end || '';

  const getCategoryBadgeVariant = (category: string): BadgeVariant => {
    switch (category ? category.toLowerCase() : '') {
      case 'new_signal':
        return 'success';
      case 'status_change':
      case 'newly_available_analysis':
      case 'new_analysis':
        return 'info';
      case 'new_note':
        return 'warning';
      case 'missing_info':
      case 'new_quality_issue':
      case 'new_data_quality_issue':
        return 'error';
      default:
        return 'neutral';
    }
  };

  const formatCategoryLabel = (cat: string): string => {
    return (cat || '').replace(/_/g, ' ').toUpperCase();
  };

  // Group unique categories for dropdown selector
  const categoryOptions = useMemo(() => {
    const map = new Map<string, number>();
    (changesComparison.changes || []).forEach((c) => {
      const cat = c.category || 'OTHER';
      map.set(cat, (map.get(cat) || 0) + 1);
    });
    return Array.from(map.entries());
  }, [changesComparison.changes]);

  const filteredChanges = useMemo(() => {
    return (changesComparison.changes || []).filter((change) => {
      if (selectedCategory !== 'all' && change.category !== selectedCategory) return false;
      return true;
    });
  }, [changesComparison.changes, selectedCategory]);

  const visibleChanges = filteredChanges.slice(0, limit);

  return (
    <Card
      title="Week-over-Week Changes"
      subtitle={`Comparing current period (${currentFrom} to ${currentTo}) against previous period (${prevFrom} to ${prevTo})`}
      action={
        <Badge variant="neutral">
          {changesComparison.changes.length} {changesComparison.changes.length === 1 ? 'change' : 'changes'} detected
        </Badge>
      }
    >
      {changesComparison.changes.length === 0 ? (
        <p className="text-xs text-slate-500 py-3">No week-over-week changes detected between periods.</p>
      ) : (
        <div className="space-y-3">
          {/* Category Dropdown Filter Bar */}
          {categoryOptions.length > 1 && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center justify-between text-xs">
              <label htmlFor="change-category-filter" className="font-semibold text-slate-700 text-[11px] whitespace-nowrap mr-2">
                Category:
              </label>
              <select
                id="change-category-filter"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setLimit(8);
                }}
                className="w-full text-xs font-medium border border-slate-300 rounded px-2 py-1 bg-white text-slate-800 shadow-2xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
              >
                <option value="all">All Categories ({changesComparison.changes.length})</option>
                {categoryOptions.map(([cat, count]) => (
                  <option key={cat} value={cat}>
                    {formatCategoryLabel(cat)} ({count})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Fixed-Height Scrollable Changes Container */}
          <div className="max-h-[460px] overflow-y-auto space-y-2.5 pr-1 border-t border-slate-100 pt-2">
            {filteredChanges.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">No changes match the selected category filter.</p>
            ) : (
              visibleChanges.map((change) => (
                <div
                  key={change.id}
                  className="border border-slate-200 rounded-lg p-3 bg-white space-y-2 hover:border-slate-300 transition-colors shadow-2xs"
                >
                  <div className="flex items-center justify-between flex-wrap gap-1.5">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <Badge variant={getCategoryBadgeVariant(change.category)} size="sm">
                        {formatCategoryLabel(change.category)}
                      </Badge>
                      {change.projectId && (
                        <span className="font-semibold text-[11px] text-indigo-700 font-mono bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                          {change.projectId}
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[11px] text-slate-400 font-medium truncate max-w-[160px]" title={change.entityId}>
                      {change.entityId}
                    </span>
                  </div>

                  <p className="text-xs text-slate-800 font-medium leading-relaxed">{change.description}</p>

                  {change.sourceRecordRefs && change.sourceRecordRefs.length > 0 && (
                    <div className="flex items-center space-x-1 flex-wrap text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                      <span className="font-medium text-slate-600">Trace Refs:</span>
                      {change.sourceRecordRefs.map((ref) => (
                        <span key={ref} className="font-mono bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-700 max-w-[200px] truncate" title={ref}>
                          {ref}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Show More / Collapse Pagination Controls */}
          {filteredChanges.length > limit && (
            <button
              onClick={() => setLimit((prev) => prev + 10)}
              className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded border border-slate-200 transition-colors text-center"
            >
              Show More ({filteredChanges.length - limit} remaining...)
            </button>
          )}

          {limit > 8 && filteredChanges.length <= limit && (
            <button
              onClick={() => setLimit(8)}
              className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium text-xs rounded border border-slate-200 transition-colors text-center"
            >
              Collapse List
            </button>
          )}
        </div>
      )}
    </Card>
  );
};
