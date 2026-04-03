import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import type {
  CreateDocumentResponse,
  DocumentRecord,
  DocumentSourceKind,
  ListDocumentsResponse
} from "@paperlens/shared";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const uploadsDirectory = path.join(process.cwd(), "..", "..", "uploads", "documents");
const metadataPath = path.join(uploadsDirectory, "index.json");

function inferSourceKind(mimeType: string, filename: string): DocumentSourceKind {
  const normalizedName = filename.toLowerCase();

  if (mimeType === "application/pdf" || normalizedName.endsWith(".pdf")) {
    return "pdf";
  }

  if (mimeType.startsWith("image/")) {
    return normalizedName.includes("scan") ? "scan" : "image";
  }

  return "screenshot";
}

async function ensureStorage() {
  await mkdir(uploadsDirectory, { recursive: true });
}

async function readDocumentIndex(): Promise<DocumentRecord[]> {
  try {
    const content = await readFile(metadataPath, "utf8");
    return JSON.parse(content) as DocumentRecord[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function writeDocumentIndex(documents: DocumentRecord[]) {
  await writeFile(metadataPath, JSON.stringify(documents, null, 2), "utf8");
}

export async function GET() {
  await ensureStorage();
  const documents = await readDocumentIndex();

  const response: ListDocumentsResponse = {
    documents
  };

  return NextResponse.json(response);
}

export async function POST(request: Request) {
  await ensureStorage();

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "A file is required." },
      { status: 400 }
    );
  }

  const documentId = randomUUID();
  const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storageName = `${documentId}-${safeFilename}`;
  const storagePath = path.join(uploadsDirectory, storageName);
  const arrayBuffer = await file.arrayBuffer();

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
    createdAt: new Date().toISOString()
  };

  documents.unshift(document);
  await writeDocumentIndex(documents);

  const response: CreateDocumentResponse = {
    document
  };

  return NextResponse.json(response, { status: 201 });
}
