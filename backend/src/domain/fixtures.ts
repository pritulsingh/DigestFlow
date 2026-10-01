/**
 * Domain Interfaces for Read-Only Source Fixture Files
 */

// 1. Signal Ledger Interfaces (data/signal-ledger.json)
export interface ProjectAnalysisStatus {
  state: 'analyzed' | 'pending' | string;
  analyzed_at: string | null;
  files_reviewed: string[];
  analysis_ref: string | null;
}

export interface SignalSources {
  granola_note: string | null;
  transcript: string | null;
  recording: string | null;
}

export interface SignalRecord {
  id: string;
  match_key: string;
  type: string;
  date: string;
  time: string;
  title: string;
  detected_on: string;
  attendees: string[];
  projects: string[];
  summary: string | null;
  expected_files: string[];
  notes: string | null;
  status: Record<string, ProjectAnalysisStatus>;
  sources: SignalSources;
}

export interface SignalLedgerContainer {
  version: number;
  signals: SignalRecord[];
}

// 2. System Configuration Interfaces (data/config.json)
export interface ProjectConfig {
  id: string;
  name: string;
  type: 'client' | 'product' | 'internal' | string;
  keywords: string[];
  domains: string[];
  emails: string[];
  active: boolean;
}

export interface ConfigFallbacks {
  unrouted: string;
  unknown_project: string;
}

export interface SystemConfig {
  projects: ProjectConfig[];
  internal_domains: string[];
  fallbacks: ConfigFallbacks;
  feed_freshness_threshold_days: number;
}

// 3. Routing Hints Interface (data/routing-hints.json)
export interface RoutingHint {
  type: 'keyword' | 'domain' | string;
  match: string;
  project: string;
  note: string;
  by: string;
  on: string;
}

// 4. Run Log Interface (data/run-log.jsonl)
export interface FeedRunStatus {
  last_file: string;
  files_seen: number;
}

export interface RunLogCounts {
  seen: number;
  new: number;
  routed: number;
  unrouted: number;
}

export interface RunLogEntry {
  run: number;
  started_at: string;
  status: 'ok' | 'fail' | string;
  error: string | null;
  counts: RunLogCounts;
  feeds: Record<string, FeedRunStatus>;
}
