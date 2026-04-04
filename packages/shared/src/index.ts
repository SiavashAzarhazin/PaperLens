export type DocumentSourceKind = "pdf" | "image" | "scan" | "screenshot";

export type DocumentStatus =
  | "uploaded"
  | "queued"
  | "processing"
  | "ready"
  | "failed";

export type ExtractedField = {
  label: string;
  value: string;
};

export type DocumentAnalysis = {
  summary: string;
  pageCount: number | null;
  textPreview: string | null;
  extractedFields: ExtractedField[];
  suggestedActions: string[];
};

export type DocumentRecord = {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  sourceKind: DocumentSourceKind;
  status: DocumentStatus;
  storagePath: string;
  createdAt: string;
  updatedAt: string;
  lastEvent: string;
  analysis: DocumentAnalysis | null;
};

export type CreateDocumentResponse = {
  document: DocumentRecord;
};

export type ListDocumentsResponse = {
  documents: DocumentRecord[];
};

export type ProcessDocumentRequest = {
  document: Pick<
    DocumentRecord,
    | "id"
    | "filename"
    | "mimeType"
    | "sizeBytes"
    | "sourceKind"
    | "status"
    | "storagePath"
  >;
};

export type ProcessDocumentResponse = {
  nextStatus: DocumentStatus;
  lastEvent: string;
  analysis: DocumentAnalysis | null;
};
