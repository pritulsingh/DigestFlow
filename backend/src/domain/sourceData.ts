/**
 * SOURCE DATA TYPES
 * Strongly-typed domain representations of raw source fixture entities.
 *
 * OWNERSHIP RULES:
 * Detector-owned fields (`id`, `match_key`, `type`, `sources`) are declared immutable (`readonly`).
 */

export interface Source {
  granola_note: string | null;
  transcript: string | null;
  recording: string | null;
}

export interface StatusInformation {
  state: 'analyzed' | 'pending' | string;
  analyzed_at: string | null;
  files_reviewed: string[];
  analysis_ref: string | null;
}

export interface Analysis {
  state: string;
  analyzedAt: string | null;
  filesReviewed: string[];
  analysisRef: string | null;
}

export interface Signal {
  /** Immutable detector-owned fields */
  readonly id: string;
  readonly match_key: string;
  readonly type: string;
  readonly sources: Source;

  /** Modifiable signal metadata */
  date: string;
  time: string;
  title: string;
  detected_on: string;
  attendees: string[];
  projects: string[];
  summary: string | null;
  expected_files: string[];
  notes: string | null;
  status: Record<string, StatusInformation>;
}

export interface Project {
  id: string;
  name: string;
  type: 'client' | 'product' | 'internal' | string;
  keywords: string[];
  domains: string[];
  emails: string[];
  active: boolean;
}

export interface RoutingInformation {
  type: 'keyword' | 'domain' | string;
  match: string;
  project: string;
  note: string;
  by: string;
  on: string;
}

export interface RunFeedStatus {
  last_file: string;
  files_seen: number;
}

export interface RunCounts {
  seen: number;
  new: number;
  routed: number;
  unrouted: number;
}

export interface Run {
  run: number;
  started_at: string;
  status: 'ok' | 'fail' | string;
  error: string | null;
  counts: RunCounts;
  feeds: Record<string, RunFeedStatus>;
}
