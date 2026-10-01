export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  timestamp: string;
}

export interface SystemInfo {
  appName: string;
  environment: string;
  fixturesStatus: {
    signalLedger: boolean;
    config: boolean;
    routingHints: boolean;
    runLog: boolean;
  };
}

export interface RoutingInformation {
  project_id?: string;
  hints?: string[];
  auto_routed?: boolean;
}

export interface StatusInformation {
  state: 'pending' | 'analyzed' | 'archived' | 'failed';
  last_updated?: string;
  summary?: string;
}

export interface Signal {
  id: string;
  match_key?: string;
  type?: string;
  date?: string;
  time?: string;
  title?: string;
  detected_on?: string;
  attendees?: string[];
  projects?: string[];
  summary?: string | null;
  notes?: string | null;
  sources?: Record<string, string | null> | string[];
  received_at?: string;
  routing?: RoutingInformation;
  status?: Record<string, { state: string; analyzed_at?: string; files_reviewed?: string[]; analysis_ref?: string }> | any;
  description?: string;
  metadata?: Record<string, any>;
}

export interface Project {
  id: string;
  name: string;
  status?: 'active' | 'maintenance' | 'deprecated' | 'planned' | string;
  description?: string;
  lead?: string;
  created_at?: string;
  tags?: string[];
}

export interface Run {
  run?: number;
  run_id?: number;
  started_at?: string;
  ended_at?: string;
  timestamp?: string;
  status?: 'success' | 'failed' | 'in_progress' | 'warning' | 'fail' | string;
  error?: string;
  message?: string;
  summary?: { files_ingested?: number; signals_matched?: number };
  items_processed?: number;
  errors_count?: number;
}

export interface DataQualityIssue {
  id: string;
  type:
    | 'unrouted_signal'
    | 'missing_summary'
    | 'dangling_reference'
    | 'near_duplicate'
    | 'stale_feed'
    | 'failed_ingest'
    | 'invalid_routing';
  severity: 'low' | 'medium' | 'high' | 'critical';
  entityId: string;
  projectId?: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface DigestItem {
  id: string;
  signalId?: string;
  type: string;
  title: string;
  body: string;
  summary?: string;
  status: string;
  updatedAt?: string;
  sourceRecordRefs?: string[];
  sourceRefs?: string[];
}

export interface DigestSection {
  id?: string;
  title?: string;
  projectId: string;
  projectName: string;
  summary: string;
  items: DigestItem[];
}

export interface WeeklyDigest {
  id: string;
  periodStart: string;
  periodEnd: string;
  status: 'draft' | 'approved' | 'published';
  createdAt: string;
  updatedAt: string;
  sections: DigestSection[];
}

export interface Change {
  id: string;
  category:
    | 'new_signal'
    | 'status_change'
    | 'new_analysis'
    | 'missing_info'
    | 'new_note'
    | 'new_quality_issue'
    | 'resolved_issue';
  entityId: string;
  projectId?: string;
  description: string;
  sourceRecordRefs: string[];
  timestamp: string;
}

export interface WeeklyChangeComparison {
  currentPeriod: { from?: string; to?: string; start?: string; end?: string };
  previousPeriod: { from?: string; to?: string; start?: string; end?: string };
  changes: Change[];
}

export interface DraftContent {
  id: string;
  periodStart: string;
  periodEnd: string;
  status: 'draft' | 'approved' | 'published';
  createdAt: string;
  updatedAt: string;
  sections: DigestSection[];
  tone?: string;
  weekIdentifier?: string;
}

export interface Draft {
  id: string;
  digestId: string;
  created: string;
  version: number;
  isApproved: boolean;
  content: DraftContent;
}

export interface AuditEvent {
  id: string;
  eventType: 'DRAFT_CREATED' | 'DRAFT_UPDATED' | 'DRAFT_APPROVED' | 'DRAFT_PUBLISHED';
  actor: string;
  timestamp: string;
  details: Record<string, any>;
}

export interface ApiErrorResponse {
  error: string;
  message: string;
}

