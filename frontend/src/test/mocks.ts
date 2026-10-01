import {
  WeeklyDigest,
  Draft,
  Signal,
  Project,
  Run,
  DataQualityIssue,
  WeeklyChangeComparison,
  HealthResponse,
  SystemInfo,
} from '../types';

export const mockHealthResponse: HealthResponse = {
  status: 'healthy',
  service: 'Weekly Digest Composer API',
  version: '1.0.0',
  timestamp: new Date().toISOString(),
};

export const mockSystemInfo: SystemInfo = {
  appName: 'Weekly Digest Composer',
  environment: 'test',
  fixturesStatus: {
    signalLedger: true,
    config: true,
    routingHints: true,
    runLog: true,
  },
};

export const mockProjects: Project[] = [
  {
    id: 'northwind',
    name: 'Northwind Health',
    status: 'active',
    description: 'Patient portal telemetry',
    lead: 'Dr. Jane Doe',
  },
  {
    id: 'atlas',
    name: 'Atlas Permits',
    status: 'active',
    description: 'Permit processing pipeline',
    lead: 'Alex Rivera',
  },
];

export const mockSignals: Signal[] = [
  {
    id: 'sig-001',
    match_key: 'northwind_telemetry',
    type: 'telemetry',
    sources: ['datadog'],
    received_at: '2026-07-06T10:00:00Z',
    routing: { project_id: 'northwind', auto_routed: true },
    status: { state: 'analyzed', summary: 'Patient Portal API latency within limits.' },
    description: 'Patient portal latency check',
  },
  {
    id: 'sig-002',
    match_key: 'unrouted_signal',
    type: 'meeting',
    sources: ['slack'],
    received_at: '2026-07-07T14:30:00Z',
    routing: {},
    status: { state: 'pending', summary: 'Unrouted meeting notes' },
    description: 'Unrouted meeting notes',
  },
];

export const mockRuns: Run[] = [
  {
    run_id: 100,
    timestamp: '2026-07-06T12:00:00Z',
    status: 'success',
    message: 'Ingest pipeline completed normally.',
    items_processed: 45,
  },
];

export const mockDataQualityIssues: DataQualityIssue[] = [
  {
    id: 'issue-001',
    type: 'unrouted_signal',
    severity: 'medium',
    entityId: 'sig-002',
    message: 'Signal sig-002 requires project routing assignment.',
  },
];

export const mockWeeklyDigest: WeeklyDigest = {
  id: 'digest-test-1',
  periodStart: '2026-07-06',
  periodEnd: '2026-07-12',
  status: 'draft',
  createdAt: '2026-07-06T00:00:00Z',
  updatedAt: '2026-07-06T00:00:00Z',
  sections: [
    {
      projectId: 'northwind',
      projectName: 'Northwind Health',
      summary: 'Patient portal performance remains stable.',
      items: [
        {
          id: 'item-1',
          signalId: 'sig-001',
          type: 'signal',
          title: 'Patient Portal Latency Nominal',
          body: 'All checks green.',
          status: 'analyzed',
          sourceRecordRefs: ['signal-ledger.json#id:sig-001'],
        },
      ],
    },
  ],
};

export const mockWeeklyChanges: WeeklyChangeComparison = {
  currentPeriod: { from: '2026-07-06', to: '2026-07-12' },
  previousPeriod: { from: '2026-06-29', to: '2026-07-05' },
  changes: [
    {
      id: 'ch-001',
      category: 'new_signal',
      entityId: 'sig-001',
      projectId: 'northwind',
      description: 'New telemetry signal recorded for Northwind Health',
      sourceRecordRefs: ['signal-ledger.json#id:sig-001'],
      timestamp: '2026-07-06T10:00:00Z',
    },
  ],
};

export const mockDraft: Draft = {
  id: 'draft-test-100',
  digestId: 'digest-test-1',
  created: '2026-07-06T00:00:00Z',
  version: 1,
  isApproved: false,
  content: {
    id: 'digest-test-1',
    periodStart: '2026-07-06',
    periodEnd: '2026-07-12',
    status: 'draft',
    createdAt: '2026-07-06T00:00:00Z',
    updatedAt: '2026-07-06T00:00:00Z',
    sections: [
      {
        projectId: 'northwind',
        projectName: 'Northwind Health',
        summary: 'Initial generated summary for Northwind Health.',
        items: [
          {
            id: 'item-1',
            signalId: 'sig-001',
            type: 'signal',
            title: 'Patient Portal Latency Nominal',
            body: 'All checks green.',
            status: 'analyzed',
            sourceRecordRefs: ['signal-ledger.json#id:sig-001'],
          },
        ],
      },
    ],
  },
};
