# DigestFlow — Weekly Digest Composer

An enterprise internal operations application built for the **Supanova Labs Paid Build Task**. DigestFlow aggregates engineering activity signals from the Inbox ledger, tracks week-over-week progress, inspects data quality, and provides a human-in-the-loop control plane for drafting, editing, approving, and publishing weekly executive digests.

---

## 🎯 Task Submission Details

- **GitHub Repository**: [https://github.com/pritulsingh/DigestFlow](https://github.com/pritulsingh/DigestFlow)
- **5 to 8 Minute Walkthrough Video**: `[UNLISTED YOUTUBE WALKTHROUGH LINK]`
- **30 to 60 Minute Build Recording Video**: `[UNLISTED YOUTUBE BUILD RECORDING LINK]`
- **Time Spent**: **~7 Hours Total**
  - *Planning & Architecture Prompt Design*: 1.5 hours
  - *Backend Services, API & Persistence Layer*: 2 hours
  - *Frontend React UI & Custom Hooks*: 1.5 hours
  - *Manual UI Polish & Custom Features*: 1 hour
  - *Vitest Integration Testing (69+ tests) & Submission Prep*: 1 hour

---

## 💡 Mission & Core Product Decision

### The Mission Question:
> *"Where should a model draft, and where must a human write?"*

### Product Rationale & Defended Decision:

1. **Where the System Drafts**:
   - **Deterministic Fact Aggregation**: Raw telemetry, meeting notes, run logs, and signal ledger items arrive continuous and unstructured. The system deterministically parses date boundaries (`from`, `to`), routes signals to project IDs using hints, calculates week-over-week status changes, and flags data-quality anomalies (e.g. unrouted signals).
   - **Draft Fact Generation**: The system generates an initial, structured draft populated with project summaries, line item details, and status badges. This eliminates manual copy-pasting and manual data compilation.

2. **Where the Human Must Write & Decide**:
   - **Inline Editorial Refinement**: Machine-generated text can lack operational nuance or context. The human reviewer retains full editorial control to modify section executive summaries, adjust line item titles, and refine body details directly in the editor.
   - **Human Decision-Maker Gate**: Content is **never** automatically committed or published to external channels. Publishing requires an explicit human reviewer approval step.
   - **Guarded State Transition**: Publishing validates payload integrity, records a publication timestamp, updates the status to `published`, and appends an immutable audit event to `audit-log.jsonl`.

---

## 🛠️ Technology Stack

### Frontend
- **React 18** (UI Components & State Management)
- **TypeScript 5** (Strict Typing & Interface Contracts)
- **Vite 8** (Build Tooling & Fast HMR)
- **Tailwind CSS 3** (Utility-First Styling & Component Design)

### Backend
- **Node.js 20** (Runtime Environment)
- **Express 4** (REST API Router & Guarded Routes)
- **TypeScript 5** (Server-Side Type Safety)

### Persistence & Security
- **Local JSON / JSONL Files** (`drafts.json`, `audit-log.jsonl`)
- **Zero Cloud Services**: No external APIs, no cloud SDKs, no databases, no secrets required.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                 React 18 UI (Vite + TS)                │
└────────────────────────────┬────────────────────────────┘
                             │ (Express REST API /api/v1)
                             ▼
┌─────────────────────────────────────────────────────────┐
│            Express REST API (Route Handlers)            │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│        Services (Business Logic & Aggregation)          │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│     Repositories & Persistence (Data Access Layer)      │
└──────────────┬──────────────────────────┬───────────────┘
               │                          │
               ▼                          ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│  Immutable Source Fixtures│   │  Application Persistence │
│  - signal-ledger.json    │   │  - drafts.json           │
│  - config.json           │   │  - audit-log.jsonl       │
│  - routing-hints.json    │   │                          │
│  - run-log.jsonl         │   │                          │
└──────────────────────────┘   └──────────────────────────┘
```

---

## 🔒 Data Integrity & Guarded Writes

- **Source Immutability**: All four source fixture files (`signal-ledger.json`, `config.json`, `routing-hints.json`, `run-log.jsonl`) are **strictly read-only**. The backend server rejects any write or mutation operations targeting fixture data.
- **Single Guarded Write Path**: Browser clients never write directly to disk. All mutations pass through server-side validation endpoints (`PUT /api/v1/digests/draft/:id`, `POST /api/v1/digests/draft/:id/publish`).
- **Atomic Persistence**: Draft saving uses temporary atomic file writes (`.tmp` creation + atomic swap) to guarantee file system integrity without data corruption.
- **Audit Ledger**: Publishing appends an immutable JSONL audit record (`audit-log.jsonl`) detailing timestamps, draft IDs, version numbers, and actor actions.

---

## 🚀 Setup & Execution Guide

### Clean Clone Installation

```bash
# 1. Clone the repository
git clone https://github.com/pritulsingh/DigestFlow.git
cd DigestFlow

# 2. Install Backend Dependencies
cd backend
npm install

# 3. Install Frontend Dependencies
cd ../frontend
npm install
```

---

## 💻 Development Commands

```bash
# Terminal 1: Run Express Backend Server (Port 3001)
cd backend
npm run dev
# Server running at http://localhost:3001

# Terminal 2: Run Vite Frontend Application (Port 5173)
cd frontend
npm run dev
# Web application running at http://localhost:5173
```

---

## 🧪 Testing Suite

```bash
# Run Backend Integration & Unit Test Suite (52 tests passed)
cd backend
npm test

# Run Frontend Vitest & Testing Library Suite (17 tests passed)
cd frontend
npm test -- --run
```

---

## 🌐 Express REST API Endpoints

### Health & Source Inspection
- `GET /api/v1/health` — API health check and server uptime.
- `GET /api/v1/signals` — Inspect raw signal ledger records.
- `GET /api/v1/projects` — Inspect project configuration catalog.
- `GET /api/v1/runs` — Inspect execution run logs.
- `GET /api/v1/data-quality` — Unrouted signal anomaly inspection.

### Digest & Draft Operations
- `GET /api/v1/digests/preview?from=YYYY-MM-DD&to=YYYY-MM-DD` — Preview aggregated digest.
- `GET /api/v1/digests/changes?from=YYYY-MM-DD&to=YYYY-MM-DD` — Week-over-week progress changes.
- `POST /api/v1/digests/draft` — Generate deterministic draft for date range.
- `GET /api/v1/digests/drafts` — Retrieve list of stored drafts.
- `PUT /api/v1/digests/draft/:id` — Save draft updates (guarded write path).
- `POST /api/v1/digests/draft/:id/approve` — Record human reviewer approval.
- `POST /api/v1/digests/draft/:id/publish` — Validate and publish digest with audit log entry.
- `GET /api/v1/published/:shareId` — Public read-only payload retrieval for share view.

---

## 📌 Manual Features Built During Recording

1. **Live Character & Word Counter** (`DraftEditor.tsx`): Real-time character and word count statistics calculation displayed dynamically in the draft editor header.
2. **`Ctrl+S` / `Cmd+S` Keyboard Save Shortcut** (`DraftEditor.tsx` & `DigestHeader.tsx`): Custom keydown listener bound to the draft save endpoint to allow instant saving while typing inside text fields.
3. **Copy Digest Markdown Button** (`ShareDigestPage.tsx`): One-click markdown clipboard export on the public share view with instant visual toast confirmation (`✓ Copied Markdown!`).

---

## ⚠️ Known Limitations & Future Work

- **Local File Persistence**: Engineered for single-node local JSON/JSONL storage. For multi-region production, an embedded database like SQLite or a relational database can be substituted behind the Repository layer.
- **Export Capabilities**: Future iterations can add native PDF generation alongside the current Markdown clipboard export.
