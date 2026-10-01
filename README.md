# Weekly Digest Composer

A professional internal productivity and operations application for aggregating engineering activity signals, tracking week-over-week progress, inspecting data quality, and publishing weekly executive digests.

---

## Problem

Operational engineering teams generate heterogeneous activity logs, system configuration changes, signal ledgers, and execution run logs across disparate systems. Manually parsing these raw streams to extract weekly accomplishments, track project updates, compare week-over-week changes, and flag data quality anomalies is time-consuming, error-prone, and lacks auditability.

---

## Product Decision

The Weekly Digest Composer enforces a strict human-in-the-loop operational model:

- **Deterministic Fact Extraction**: Aggregates raw signals, execution logs, and project configurations into structured weekly summaries based on deterministic date boundaries and project routing rules.
- **Draft Generation**: Programmatically generates an initial weekly executive draft containing project activity breakdowns and week-over-week change tracking.
- **Human Review**: Reviewers inspect, customize, and refine draft content inline. Unsaved edits are clearly highlighted, and changes can be explicitly saved or reverted.
- **Explicit Publication**: Publishing is a deliberate human decision. Content is validated, checked for source data stability, updated to `published` status, recorded with a publication timestamp, and appended to an append-only JSONL audit log. Content is **never** automatically published.

---

## Technology Stack

### Frontend
- **React 18**
- **TypeScript 5**
- **Vite 8**
- **Tailwind CSS 3**

### Backend
- **Node.js 20**
- **Express 4**
- **TypeScript 5**

### Persistence
- **Local JSON / JSONL** (`drafts.json`, `audit-log.jsonl`)

---

## Architecture

```
React (Frontend UI)
       │
       ▼ (HTTP REST API Client)
Express REST API (Route Handlers)
       │
       ▼
Services (Business Logic & Weekly Aggregation)
       │
       ▼
Repositories (Data Access & Abstraction Layer)
       │
       ▼
JSON / JSONL Files (Local Storage Layer)
```

---

## Source Data

The backend reads from four immutable server-side source fixture files located in `data/`:

1. `signal-ledger.json`: Raw activity signals containing timestamps, statuses, source references, and payload metadata.
2. `config.json`: System and project configurations defining project IDs, display names, and owner mappings.
3. `routing-hints.json`: Declarative rules for routing signals to specific projects or cataloging them as unrouted.
4. `run-log.jsonl`: Execution run records containing status outputs, timestamps, and execution metrics.

---

## Application Data

Application-generated state is persisted in server-owned files in `data/`:

1. `drafts.json`: Persists human-edited weekly digest drafts, version numbers, approval flags, and published statuses.
2. `audit-log.jsonl`: An append-only audit ledger recording publication events, timestamps, draft version IDs, and actor metadata.

---

## Data Integrity

- **Source Immutability**: Source fixture files (`signal-ledger.json`, `config.json`, `routing-hints.json`, `run-log.jsonl`) are strictly read-only. The server rejects any attempt to mutate source fixtures.
- **Ownership Rules**: The Express backend server is the sole owner of storage files. The browser client interacts exclusively via REST API endpoints and never directly accesses local files.
- **Guarded Writes**: Draft saving and publishing validate payload schemas, version match parameters, and data integrity boundaries prior to write.
- **Atomic Persistence**: File writes to `drafts.json` utilize atomic temporary file swaps (`.tmp` file creation followed by atomic rename) to prevent file corruption during concurrent operations or system interruptions.

---

## Setup

```bash
# Clone the repository and install dependencies

# 1. Install Backend Dependencies
cd backend
npm install

# 2. Install Frontend Dependencies
cd ../frontend
npm install
```

---

## Development

```bash
# Terminal 1: Run Backend Express REST API Server
cd backend
npm run dev
# Server listening at http://localhost:8000

# Terminal 2: Run Frontend Vite React Application
cd frontend
npm run dev
# Web application running at http://localhost:3000
```

---

## Testing

```bash
# Run Backend Vitest & Supertest Integration Suite (52 tests)
cd backend
npm test

# Run Frontend Vitest & React Testing Library Suite (17 tests)
cd frontend
npm test -- --run
```

---

## API

### Health & Inspection Endpoints
- `GET /health` - Health check status and service uptime.
- `GET /signals` - Inspect raw signal ledger records.
- `GET /projects` - Inspect project configuration catalog.
- `GET /runs` - Inspect execution run logs.
- `GET /data-quality` - Programmatic anomaly detection & unrouted signal issues.

### Digest & Draft Operations
- `GET /digests/preview?from=YYYY-MM-DD&to=YYYY-MM-DD` - Preview aggregated digest for date period.
- `GET /digests/changes?from=YYYY-MM-DD&to=YYYY-MM-DD` - Week-over-week changes comparison against previous period.
- `POST /digests/draft` - Generate new deterministic draft for selected date period.
- `GET /digests/drafts` - List all stored drafts.
- `PUT /digests/draft/:id` - Save draft modifications.
- `POST /digests/draft/:id/approve` - Approve draft for publishing (Human reviewer step).
- `POST /digests/draft/:id/publish` - Validate and explicitly publish digest, recording audit log entry.
- `GET /published/:id` - Public read-only route to retrieve published digest payload.

---

## Known Limitations

- **Single-Node Local Filesystem Storage**: Designed for local file persistence (`drafts.json` and `audit-log.jsonl`) rather than a distributed database cluster.
- **Manual Date Period Selection**: Reporting period filtering relies on explicit week start/end date parameters (`from`, `to`).
- **Template-Based Draft Generation**: Draft summaries are produced deterministically via template logic without remote LLM service dependencies.

---

## Future Improvements

- **Role-Based Access Control (RBAC)**: Enforce granular reviewer, editor, and publisher permission roles.
- **Notification Integrations**: Trigger automated webhook notifications (e.g. Slack / Teams) upon digest publication.
- **Export Formats**: Support PDF and Markdown export for published weekly executive digests.
