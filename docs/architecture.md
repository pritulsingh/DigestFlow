# Weekly Digest Composer - System Architecture & Directory Specification

## Architectural Principles

1. **Technology Stack**:
   - **Frontend**: React + TypeScript + Vite + Tailwind CSS.
   - **Backend**: Node.js + Express + TypeScript.
   - **Persistence**: Local JSON / JSONL files under `data/` directory (Zero database servers / SQLite).
2. **API-First Architecture**: The Express backend acts as the sole gateway to source data and system operations. The browser communicates exclusively via RESTful HTTP API contracts.
3. **Strict Server-Side Fixture Isolation**: The browser is strictly forbidden from directly importing or accessing raw fixture JSON/JSONL files (`data/`). All file reading is handled server-side in the backend.
4. **Source Data Fixture Integrity**: The four core source data files (`signal-ledger.json`, `config.json`, `routing-hints.json`, `run-log.jsonl`) are preserved with exact names and un-modified contents.
5. **Layered Separation of Concerns**:
   - **API / Routes**: Express route handlers, HTTP status codes, request/response validation. Zero business logic.
   - **Services**: Pure domain logic and file handling workflows.
   - **Repositories**: Encapsulates file reading abstractions.
   - **Persistence**: File storage helpers (`fileStorage.ts`) for JSON and JSONL reading.
   - **Config**: Centralized environment and file path configuration.

---

## Directory Specification

| Directory | Layer / Purpose | Key Contents & Responsibilities |
| :--- | :--- | :--- |
| `/frontend` | Client UI Application | React + TypeScript + Vite + Tailwind CSS single-page application. |
| `/frontend/src/api` | API Client Layer | Typed HTTP client (`client.ts`) for calling backend routes. |
| `/frontend/src/components` | UI Components | Modular React UI components. |
| `/frontend/src/hooks` | React Hooks | Custom hooks for state and data fetching. |
| `/frontend/src/pages` | UI Views | View pages (`HomePage.tsx`). |
| `/frontend/src/types` | Type Contracts | TypeScript interfaces matching backend contracts. |
| `/frontend/src/utils` | Helpers & Utilities | Shared formatting and utility functions. |
| `/backend` | Express API Server | Node.js + Express + TypeScript backend server. |
| `/backend/src/api/routes` | Route Handlers | Express routes for endpoints (`/health`, `/system-info`). |
| `/backend/src/config` | System Config | Centralized configuration loading (`index.ts`). |
| `/backend/src/domain` | Domain Models | TypeScript interfaces for backend entities and response DTOs. |
| `/backend/src/persistence` | File Persistence | `fileStorage.ts` for safe JSON and JSONL reading. |
| `/backend/src/repositories` | Data Repositories | Base file repository interfaces and implementations. |
| `/backend/src/services` | Domain Services | Service classes for system logic (`healthService.ts`). |
| `/backend/src/server.ts` | Server Entry Point | Express app setup, CORS, and port listening. |
| `/data` | Server Data Storage | Contains local fixture files (`signal-ledger.json`, `config.json`, `routing-hints.json`, `run-log.jsonl`). Restricted to backend server access only. |
| `/tests` | Automated Test Suite | Test specifications for backend and frontend. |
| `/docs` | Documentation | Architectural design and documentation. |
