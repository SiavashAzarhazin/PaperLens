# Architecture

## System shape

PaperLens starts as a modular monorepo with a clear split between product code and intelligence code.

### `apps/web`

The web app is the user-facing surface area. It will own:

- authentication and session management
- upload flows
- document browsing and review UX
- extraction results and citation rendering
- job status and evaluation dashboards

### `services/ai`

The AI service is a Python FastAPI application responsible for:

- OCR orchestration
- parsing and chunking documents
- embedding and retrieval workflows
- structured extraction
- confidence scoring and evaluation

### `packages/shared`

The shared package holds typed contracts that both the frontend and backend can rely on. Early on, that means:

- document metadata types
- ingestion status enums
- extraction payload shapes
- API request and response contracts

## Early architecture decisions

1. Use TypeScript for product-facing code and Python for document intelligence.
2. Keep the first milestone simple by using PostgreSQL with `pgvector` instead of introducing a separate vector database.
3. Treat ingestion as an async workflow from day one so the system can scale to large files and long-running OCR jobs.
4. Preserve document provenance everywhere so answers can always point back to a source region.

## Near-term implementation sequence

1. Bring up the Next.js app and FastAPI service locally.
2. Add shared document contracts and an upload flow.
3. Introduce job tracking and a local processing queue.
4. Add OCR, chunking, and citation-aware retrieval.
