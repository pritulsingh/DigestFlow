/**
 * APPLICATION TYPES
 * Domain concepts owned and operated by the Weekly Digest Composer application.
 * Kept strictly separate from source data fixture types.
 */

export interface DataQualityIssue {
  id: string;
  type: string;
  severity: 'warning' | 'error' | 'critical';
  entityId: string;
  projectId?: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface DigestItem {
  id: string;
  signalId: string;
  title: string;
  summary: string;
  body?: string;
  sourceRefs: string[];
  sourceRecordRefs?: string[];
  category?: string;
  type?: string;
  status?: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface DigestSection {
  id: string;
  title: string;
  projectId?: string;
  projectName?: string;
  summary?: string;
  items: DigestItem[];
}

export interface WeeklyDigest {
  id: string;
  title: string;
  weekIdentifier: string;
  status: 'draft' | 'under_review' | 'approved' | 'published';
  sections: DigestSection[];
  createdAt: string;
  updatedAt: string;
  periodStart?: string;
  periodEnd?: string;
  metadata?: Record<string, unknown>;
}

export interface Change {
  id: string;
  entityType: 'digest' | 'item' | 'section' | 'draft' | string;
  entityId: string;
  changeType: 'created' | 'updated' | 'deleted' | 'reordered';
  previousValue?: unknown;
  newValue?: unknown;
  changedBy: string;
  timestamp: string;
}

export interface Draft {
  id: string;
  digestId: string;
  version: number;
  content: WeeklyDigest;
  isApproved: boolean;
  createdById: string;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  eventType: string;
  actor: string;
  timestamp: string;
  details: Record<string, unknown>;
}

export type ChangeCategory =
  | 'NEW_SIGNAL'
  | 'STATUS_CHANGE'
  | 'NEWLY_AVAILABLE_ANALYSIS'
  | 'NEWLY_MISSING_INFORMATION'
  | 'NEW_NOTE'
  | 'NEW_DATA_QUALITY_ISSUE'
  | 'RESOLVED_ISSUE';

export interface SignalChangeItem {
  id: string;
  category: ChangeCategory;
  entityId: string;
  projectId?: string;
  description: string;
  previousState?: unknown;
  currentState?: unknown;
  sourceRecordRefs: string[];
}

export interface WeeklyChangeComparison {
  currentPeriod: { from: string; to: string; start: string; end: string };
  previousPeriod: { from: string; to: string; start: string; end: string };
  changes: SignalChangeItem[];
  summary: {
    totalNewSignals: number;
    totalStatusChanges: number;
    totalNewlyAvailableAnalysis: number;
    totalNewNotes: number;
    totalNewIssues: number;
    totalResolvedIssues: number;
  };
}
