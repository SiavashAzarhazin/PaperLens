import { advanceDocumentStatus } from "@/lib/document-store";
import { NextResponse } from "next/server";

type ProcessRouteContext = {
  params: Promise<{
    documentId: string;
  }>;
};

export async function POST(_request: Request, context: ProcessRouteContext) {
  const { documentId } = await context.params;
  const document = await advanceDocumentStatus(documentId);

  if (!document) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  return NextResponse.json({ document });
}
