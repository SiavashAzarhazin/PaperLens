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
  sourceKind: DocumentSourceKind;
  status: DocumentStatus;
  createdAt: string;
};
