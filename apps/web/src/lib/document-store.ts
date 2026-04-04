import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type {
  DocumentAnalysis,
  DocumentRecord,
  DocumentSourceKind,
  DocumentStatus
} from "@paperlens/shared";

const uploadsDirectory = path.join(process.cwd(), "..", "..", "uploads", "documents");
const metadataPath = path.join(uploadsDirectory, "index.json");

const statusEventMessage: Record<DocumentStatus, string> = {
  uploaded: "Document uploaded to local storage.",
  queued: "Document is waiting in the local ingestion queue.",
  processing: "Document is moving through the mock OCR and extraction pipeline.",
  ready: "Document completed the local demo pipeline and is ready for review.",
  failed: "Document processing failed and needs attention."
};

export function inferSourceKind(mimeType: string, filename: string): DocumentSourceKind {
  const normalizedName = filename.toLowerCase();

  if (mimeType === "application/pdf" || normalizedName.endsWith(".pdf")) {
    return "pdf";
  }

  if (mimeType.startsWith("image/")) {
    return normalizedName.includes("scan") ? "scan" : "image";
  }

  return "screenshot";
}

export async function ensureStorage() {
  await mkdir(uploadsDirectory, { recursive: true });
}

export async function readDocumentIndex(): Promise<DocumentRecord[]> {
  try {
    const content = await readFile(metadataPath, "utf8");
    const parsedDocuments = JSON.parse(content) as Array<Partial<DocumentRecord>>;

    return parsedDocuments.map((document) => {
      const status = document.status ?? "uploaded";
      const createdAt = document.createdAt ?? new Date().toISOString();

      return {
        id: document.id ?? randomUUID(),
        filename: document.filename ?? "unknown-file",
        mimeType: document.mimeType ?? "application/octet-stream",
        sizeBytes: document.sizeBytes ?? 0,
        sourceKind: document.sourceKind ?? "screenshot",
        status,
        storagePath: document.storagePath ?? "",
        createdAt,
        updatedAt: document.updatedAt ?? createdAt,
        lastEvent: document.lastEvent ?? statusEventMessage[status],
        analysis: document.analysis ?? null
      };
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

export async function writeDocumentIndex(documents: DocumentRecord[]) {
  await writeFile(metadataPath, JSON.stringify(documents, null, 2), "utf8");
}

export async function getDocumentById(documentId: string) {
  const documents = await readDocumentIndex();
  return documents.find((document) => document.id === documentId) ?? null;
}

export async function createDocumentRecord(file: File) {
  await ensureStorage();

  const documentId = randomUUID();
  const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storageName = `${documentId}-${safeFilename}`;
  const storagePath = path.join(uploadsDirectory, storageName);
  const arrayBuffer = await file.arrayBuffer();
  const timestamp = new Date().toISOString();

  await writeFile(storagePath, Buffer.from(arrayBuffer));

  const documents = await readDocumentIndex();
  const document: DocumentRecord = {
    id: documentId,
    filename: file.name,
    mimeType: file.type || "application/octet-stream",
    sizeBytes: file.size,
    sourceKind: inferSourceKind(file.type, file.name),
    status: "uploaded",
    storagePath,
    createdAt: timestamp,
    updatedAt: timestamp,
    lastEvent: statusEventMessage.uploaded,
    analysis: null
  };

  documents.unshift(document);
  await writeDocumentIndex(documents);

  return document;
}

export async function updateDocumentProcessingState(
  documentId: string,
  updates: {
    nextStatus: DocumentStatus;
    lastEvent: string;
    analysis: DocumentAnalysis | null;
  }
) {
  await ensureStorage();
  const documents = await readDocumentIndex();
  const documentIndex = documents.findIndex((document) => document.id === documentId);

  if (documentIndex === -1) {
    return null;
  }

  const currentDocument = documents[documentIndex];
  const updatedDocument: DocumentRecord = {
    ...currentDocument,
    status: updates.nextStatus,
    updatedAt: new Date().toISOString(),
    lastEvent: updates.lastEvent,
    analysis: updates.analysis
  };

  documents[documentIndex] = updatedDocument;
  await writeDocumentIndex(documents);

  return updatedDocument;
}
