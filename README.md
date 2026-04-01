# PaperLens

PaperLens is a multimodal document intelligence platform that turns PDFs, scans, and screenshots into structured data, grounded answers, and source-linked insights.

## Vision

PaperLens helps users move from raw documents to trustworthy answers. Instead of treating a PDF like a blob of text, the platform extracts structure, preserves context, and grounds every answer in the original source.

The long-term goal is to support three core workflows:

1. Upload and process complex documents.
2. Search, extract, and query their contents with citations.
3. Review low-confidence outputs with a human-in-the-loop workflow.

## Repository layout

```text
.
|-- apps/
|   `-- web/              # Next.js product shell and frontend
|-- services/
|   `-- ai/               # FastAPI service for OCR, parsing, retrieval, and extraction
|-- packages/
|   `-- shared/           # Shared types and contracts between services
`-- docs/                 # Architecture notes and roadmap
```

## Tech stack

- Frontend and product shell: Next.js, React, TypeScript
- Backend and APIs: TypeScript
- AI and document pipeline: Python, FastAPI
- Data and retrieval: PostgreSQL with `pgvector`
- Caching and background jobs: Redis
- File storage: S3-compatible object storage

## Planned MVP

- Document upload for PDFs, images, and scans
- OCR and layout-aware document ingestion
- Search and question answering with source citations
- Structured field extraction with confidence scores
- Job-based processing pipeline with status tracking
- Evaluation dataset for measuring extraction quality

## Getting started

This repository is currently in scaffold mode. The first implementation milestone is to:

1. Boot the Next.js app in `apps/web`
2. Expose a health endpoint from `services/ai`
3. Define the shared ingestion and extraction contracts in `packages/shared`

## Docs

- [Architecture](/Users/vashprime/Documents/Repository/Side%20Projects/PaperLens/docs/architecture.md)
- [Roadmap](/Users/vashprime/Documents/Repository/Side%20Projects/PaperLens/docs/roadmap.md)
