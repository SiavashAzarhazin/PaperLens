"use client";

import type { ChangeEvent, FormEvent } from "react";
import type { CreateDocumentResponse, DocumentRecord, ListDocumentsResponse } from "@paperlens/shared";
import Link from "next/link";
import { useEffect, useState } from "react";

const featurePillars = [
  "Ground every answer in the original source",
  "Track ingestion through a real document lifecycle",
  "Start simple locally, then scale into OCR and retrieval"
];

function formatBytes(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function HomePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadDocuments() {
      try {
        const response = await fetch("/api/documents");

        if (!response.ok) {
          throw new Error("Could not load documents.");
        }

        const payload = (await response.json()) as ListDocumentsResponse;
        setDocuments(payload.documents);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Could not load documents."
        );
      } finally {
        setIsLoadingDocuments(false);
      }
    }

    void loadDocuments();
  }, []);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;
    setSelectedFile(nextFile);
    setErrorMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile) {
      setErrorMessage("Choose a document before uploading.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        throw new Error("Upload failed. Try another file.");
      }

      const payload = (await response.json()) as CreateDocumentResponse;
      setDocuments((currentDocuments) => [payload.document, ...currentDocuments]);
      setSelectedFile(null);
      event.currentTarget.reset();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Upload failed. Try another file."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="hero-grid">
        <div className="hero">
          <p className="eyebrow">Multimodal document intelligence</p>
          <h1>Upload the first artifact in the PaperLens archive.</h1>
          <p className="lede">
            This first vertical slice stores a document locally, records its
            metadata, and tracks its ingestion status. It is the foundation for
            OCR, extraction, and grounded retrieval later.
          </p>
        </div>

        <aside className="hero-panel">
          <p className="panel-label">Current build quest</p>
          <ul className="pillar-list">
            {featurePillars.map((pillar) => (
              <li key={pillar}>{pillar}</li>
            ))}
          </ul>
        </aside>
      </section>

      <section className="workspace-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="panel-label">Step 1</p>
              <h2>Upload a document</h2>
            </div>
            <span className="status-badge status-badge-active">Local mode</span>
          </div>

          <form className="upload-form" onSubmit={handleSubmit}>
            <label className="upload-input">
              <span>Choose a PDF, image, scan, or screenshot</span>
              <input
                accept=".pdf,image/*"
                name="file"
                onChange={handleFileChange}
                type="file"
              />
            </label>

            <div className="upload-meta">
              <p>
                {selectedFile
                  ? `${selectedFile.name} · ${formatBytes(selectedFile.size)}`
                  : "No file selected yet."}
              </p>
            </div>

            <button className="primary-button" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Uploading..." : "Upload document"}
            </button>
          </form>

          {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="panel-label">Step 2</p>
              <h2>Tracked documents</h2>
            </div>
            <span className="status-badge">
              {documents.length} stored
            </span>
          </div>

          {isLoadingDocuments ? (
            <p className="empty-state">Loading the archive...</p>
          ) : documents.length === 0 ? (
            <p className="empty-state">
              No documents yet. Upload one to start PaperLens history.
            </p>
          ) : (
            <div className="document-list">
              {documents.map((document) => (
                <article className="document-card" key={document.id}>
                  <div className="document-card-header">
                    <div>
                      <h3>{document.filename}</h3>
                      <p>
                        {document.sourceKind} · {formatBytes(document.sizeBytes)}
                      </p>
                    </div>
                    <span className={`status-badge status-${document.status}`}>
                      {document.status}
                    </span>
                  </div>

                  <dl className="document-meta">
                    <div>
                      <dt>MIME</dt>
                      <dd>{document.mimeType}</dd>
                    </div>
                    <div>
                      <dt>Created</dt>
                      <dd>{new Date(document.createdAt).toLocaleString()}</dd>
                    </div>
                  </dl>

                  <Link className="detail-link" href={`/documents/${document.id}`}>
                    Open document detail →
                  </Link>
                </article>
              ))}
            </div>
          )}
        </article>
      </section>
    </main>
  );
}
