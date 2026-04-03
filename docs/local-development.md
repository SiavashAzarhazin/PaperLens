# Local development

This project has two main runtime pieces:

1. `apps/web`: the Next.js app written in TypeScript
2. `services/ai`: the FastAPI service written in Python

## Why the repository is split this way

The web app owns the user experience and product logic.
The AI service owns document ingestion, OCR, retrieval, and extraction workflows.

This split is useful because:

- the frontend and product code benefit from the TypeScript ecosystem
- the document intelligence layer benefits from the Python ML ecosystem
- each part can evolve independently without turning the repo into a tangled ball of cables

## Install prerequisites

### Node.js

Install Node.js 20 or newer. This gives you:

- `node`: the JavaScript runtime
- `npm`: the package manager

You can verify the installation with:

```bash
node --version
npm --version
```

### Python

Python 3.9 or newer is enough for the current AI service scaffold.

Verify with:

```bash
python3 --version
```

## Run the web app

From the repository root:

```bash
npm install
npm run dev:web
```

What this does:

- `npm install` reads `package.json` files and downloads the frontend dependencies
- `npm run dev:web` runs the `dev` script inside the `@paperlens/web` workspace
- Next.js starts a local development server, usually on `http://localhost:3000`

## Run the AI service

From the repository root:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r services/ai/requirements.txt
npm run dev:ai
```

What this does:

- `python3 -m venv .venv` creates an isolated Python environment
- `source .venv/bin/activate` activates it in your shell
- `pip install -r ...` installs FastAPI and Uvicorn
- `npm run dev:ai` uses the root script to start the FastAPI app on `http://localhost:8000`

The AI health endpoint will be:

```text
http://localhost:8000/health
```

## TypeScript notes

If TypeScript is new to you, the key idea is that it is JavaScript plus types.

Example:

```ts
type DocumentRecord = {
  id: string;
  filename: string;
};
```

This does not create runtime behavior by itself. It tells the editor and compiler what shape a value should have, which helps catch mistakes early.

In the Next.js app:

- `page.tsx` is a page component
- `layout.tsx` wraps pages in shared HTML structure
- `route.ts` defines a server endpoint in the app router

So:

- `apps/web/src/app/page.tsx` renders UI
- `apps/web/src/app/api/health/route.ts` returns JSON from a backend-style route

That split is one of the nice things about Next.js: UI and server routes can live in the same app structure.
