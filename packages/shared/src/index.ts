export type DocumentSourceKind = "pdf" | "image" | "scan" | "screenshot";

export type DocumentStatus =
  | "uploaded"
  | "queued"
  | "processing"
  | "ready"
  | "failed";

export type DocumentRecord = {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  sourceKind: DocumentSourceKind;
  status: DocumentStatus;
  storagePath: string;
  createdAt: string;
};

export type CreateDocumentResponse = {
  document: DocumentRecord;
};

export type ListDocumentsResponse = {
  documents: DocumentRecord[];
};
