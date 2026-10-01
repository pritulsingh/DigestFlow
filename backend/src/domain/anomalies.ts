export type AnomalyCategory =
  | 'DUPLICATE_SIGNAL_ID'
  | 'UNREGISTERED_PROJECT_REFERENCE'
  | 'ROUTING_HINT_TARGET_TYPO'
  | 'ORPHANED_ANALYSIS_RUN_REFERENCE'
  | 'RUN_LOG_PIPELINE_FAILURE';

export interface AnomalyDetail {
  category: AnomalyCategory;
  severity: 'WARNING' | 'ERROR';
  description: string;
  affectedIdentifier?: string;
  details?: Record<string, any>;
}

export interface FixtureAnomalyReport {
  totalSignals: number;
  totalProjects: number;
  totalRoutingHints: number;
  totalRunLogs: number;
  anomalies: AnomalyDetail[];
}
