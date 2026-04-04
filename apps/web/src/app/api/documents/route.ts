import type {
  CreateDocumentResponse,
  ListDocumentsResponse
} from "@paperlens/shared";
import { createDocumentRecord, ensureStorage, readDocumentIndex } from "@/lib/document-store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

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

  const document = await createDocumentRecord(file);

  const response: CreateDocumentResponse = {
    document
  };

  return NextResponse.json(response, { status: 201 });
}
