import type { DocumentStatus } from "@paperlens/shared";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getDocumentById } from "@/lib/document-store";
import { ProcessButton } from "./process-button";

const statusCopy: Record<DocumentStatus, string> = {
  uploaded: "Freshly stored. The file exists locally, but no pipeline work has started yet.",
  queued: "Queued for the next ingestion step. In a future version, a worker would pick it up from here.",
  processing: "Actively moving through the mock pipeline. This is where OCR, parsing, and extraction will eventually live.",
  ready: "Pipeline complete for the local demo. The document is ready for review and future extraction features.",
  failed: "Something broke during processing. The next recovery step would be retries or manual review."
};

type DocumentDetailPageProps = {
  params: Promise<{
    documentId: string;
  }>;
};

function canAdvance(status: DocumentStatus) {
  return status !== "ready";
}

export default async function DocumentDetailPage({
  params
}: DocumentDetailPageProps) {
  const { documentId } = await params;
  const document = await getDocumentById(documentId);

  if (!document) {
    notFound();
  }

  return (
    <main className="page-shell detail-shell">
      <div className="detail-back-link">
        <Link href="/">← Back to archive</Link>
      </div>

      <section className="detail-hero panel">
        <div className="panel-header">
          <div>
            <p className="panel-label">Document control room</p>
            <h1>{document.filename}</h1>
            <p className="lede">
              {statusCopy[document.status]}
            </p>
          </div>
          <span className={`status-badge status-${document.status}`}>
            {document.status}
          </span>
        </div>
      </section>

      <section className="workspace-grid detail-grid">
        <article className="panel">
          <p className="panel-label">Metadata</p>
          <dl className="detail-meta-grid">
            <div>
              <dt>Document ID</dt>
              <dd>{document.id}</dd>
            </div>
            <div>
              <dt>Source kind</dt>
              <dd>{document.sourceKind}</dd>
            </div>
            <div>
              <dt>MIME type</dt>
              <dd>{document.mimeType}</dd>
            </div>
            <div>
              <dt>Size</dt>
              <dd>{document.sizeBytes} bytes</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{new Date(document.createdAt).toLocaleString()}</dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>{new Date(document.updatedAt).toLocaleString()}</dd>
            </div>
            <div className="detail-meta-span">
              <dt>Storage path</dt>
              <dd>{document.storagePath}</dd>
            </div>
          </dl>
        </article>

        <article className="panel">
          <p className="panel-label">Pipeline state</p>
          <h2>Advance the local ingestion quest</h2>
          <p className="lede">
            Each click moves the document to the next state in the pipeline so
            you can inspect how status transitions work before real workers and
            OCR jobs exist.
          </p>

          <div className="event-log">
            <p className="event-log-label">Latest event</p>
            <p>{document.lastEvent}</p>
          </div>

          <ProcessButton
            disabled={!canAdvance(document.status)}
            documentId={document.id}
          />
        </article>
      </section>
    </main>
  );
}
