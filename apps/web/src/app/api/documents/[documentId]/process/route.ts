import type { ProcessDocumentRequest, ProcessDocumentResponse } from "@paperlens/shared";
import { getDocumentById, updateDocumentProcessingState } from "@/lib/document-store";
import { NextResponse } from "next/server";

type ProcessRouteContext = {
  params: Promise<{
    documentId: string;
  }>;
};

export async function POST(_request: Request, context: ProcessRouteContext) {
  const { documentId } = await context.params;
  const document = await getDocumentById(documentId);

  if (!document) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  const apiBaseUrl =
    process.env.PAPERLENS_API_BASE_URL ?? "http://127.0.0.1:8000";

  const payload: ProcessDocumentRequest = {
    document: {
      id: document.id,
      filename: document.filename,
      mimeType: document.mimeType,
      sizeBytes: document.sizeBytes,
      sourceKind: document.sourceKind,
      status: document.status
    }
  };

  const processingResponse = await fetch(`${apiBaseUrl}/documents/process`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload),
    cache: "no-store"
  }).catch(() => null);

  if (!processingResponse?.ok) {
    return NextResponse.json(
      { error: "The AI service could not process this document right now." },
      { status: 502 }
    );
  }

  const processingResult =
    (await processingResponse.json()) as ProcessDocumentResponse;
  const updatedDocument = await updateDocumentProcessingState(documentId, {
    nextStatus: processingResult.nextStatus,
    lastEvent: processingResult.lastEvent,
    analysis: processingResult.analysis
  });

  return NextResponse.json({ document: updatedDocument });
}
