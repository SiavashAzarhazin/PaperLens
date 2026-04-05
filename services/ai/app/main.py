from fastapi import FastAPI
from pathlib import Path
from PIL import Image
from pypdf import PdfReader
import pytesseract
from pydantic import BaseModel
import subprocess
import tempfile
from typing import Literal, Optional


DocumentStatus = Literal["uploaded", "queued", "processing", "ready", "failed"]
DocumentSourceKind = Literal["pdf", "image", "scan", "screenshot"]


class DocumentInput(BaseModel):
    id: str
    filename: str
    mimeType: str
    sizeBytes: int
    sourceKind: DocumentSourceKind
    status: DocumentStatus
    storagePath: str


class ProcessDocumentRequest(BaseModel):
    document: DocumentInput


class ExtractedField(BaseModel):
    label: str
    value: str


class DocumentAnalysis(BaseModel):
    summary: str
    pageCount: Optional[int]
    textPreview: Optional[str]
    textSource: Literal["native_pdf", "ocr_pdf", "ocr_image", "none"]
    extractedFields: list[ExtractedField]
    suggestedActions: list[str]


class ProcessDocumentResponse(BaseModel):
    nextStatus: DocumentStatus
    lastEvent: str
    analysis: Optional[DocumentAnalysis]

app = FastAPI(
    title="PaperLens AI Service",
    description=(
        "Handles document ingestion, OCR orchestration, extraction, and grounded "
        "retrieval workflows for PaperLens."
    ),
    version="0.1.0",
)


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok", "service": "paperlens-ai"}


def extract_pdf_text(document: DocumentInput) -> tuple[Optional[int], Optional[str]]:
    if document.sourceKind != "pdf":
        return None, None

    if not document.storagePath:
        return None, None

    file_path = Path(document.storagePath)

    if not file_path.exists():
        return None, None

    reader = PdfReader(str(file_path))
    page_text: list[str] = []

    for page in reader.pages[:3]:
        extracted = page.extract_text() or ""
        cleaned = " ".join(extracted.split())

        if cleaned:
            page_text.append(cleaned)

    preview = " ".join(page_text)[:800] if page_text else None
    return len(reader.pages), preview


def extract_pdf_text_with_ocr(document: DocumentInput) -> tuple[Optional[int], Optional[str]]:
    if document.sourceKind != "pdf":
        return None, None

    file_path = Path(document.storagePath)

    if not file_path.exists():
        return None, None

    try:
        reader = PdfReader(str(file_path))
        page_count = len(reader.pages)
    except Exception:
        page_count = None

    with tempfile.TemporaryDirectory(prefix="paperlens-ocr-") as temp_dir:
        output_prefix = Path(temp_dir) / "page"
        command = [
            "pdftoppm",
            "-f",
            "1",
            "-l",
            "2",
            "-png",
            str(file_path),
            str(output_prefix),
        ]
        completed = subprocess.run(command, capture_output=True, text=True)

        if completed.returncode != 0:
            return page_count, None

        extracted_chunks: list[str] = []

        for image_path in sorted(Path(temp_dir).glob("page-*.png")):
            image = Image.open(image_path)
            text = pytesseract.image_to_string(image, lang="eng")
            cleaned = " ".join(text.split())

            if cleaned:
                extracted_chunks.append(cleaned)

        preview = " ".join(extracted_chunks)[:800] if extracted_chunks else None
        return page_count, preview


def extract_image_text_with_ocr(document: DocumentInput) -> tuple[Optional[int], Optional[str]]:
    if document.sourceKind not in {"image", "scan", "screenshot"}:
        return None, None

    file_path = Path(document.storagePath)

    if not file_path.exists():
        return None, None

    image = Image.open(file_path)
    text = pytesseract.image_to_string(image, lang="eng")
    cleaned = " ".join(text.split())
    return 1, cleaned[:800] if cleaned else None


def build_analysis(document: DocumentInput) -> DocumentAnalysis:
    page_count, text_preview = extract_pdf_text(document)
    text_source: Literal["native_pdf", "ocr_pdf", "ocr_image", "none"] = "native_pdf"

    if not text_preview and document.sourceKind == "pdf":
        page_count, text_preview = extract_pdf_text_with_ocr(document)
        text_source = "ocr_pdf" if text_preview else "none"
    elif not text_preview:
        page_count, text_preview = extract_image_text_with_ocr(document)
        text_source = "ocr_image" if text_preview else "none"
        if not text_preview:
            text_source = "none"

    summary = (
        f"{document.filename} looks like a {document.sourceKind} asset with "
        f"content type {document.mimeType}. The current pipeline is heuristic, "
        "so this is a first-pass technical readout rather than real OCR."
    )

    if text_preview and text_source == "native_pdf":
        summary = (
            f"{document.filename} exposed native PDF text successfully. "
            "PaperLens can already read textual PDFs before OCR is added."
        )
    elif text_preview and text_source == "ocr_pdf":
        summary = (
            f"{document.filename} required OCR fallback, and PaperLens recovered readable text from rendered PDF pages."
        )
    elif text_preview and text_source == "ocr_image":
        summary = (
            f"{document.filename} was treated as an image document, and PaperLens recovered readable text through OCR."
        )

    return DocumentAnalysis(
        summary=summary,
        pageCount=page_count,
        textPreview=text_preview,
        textSource=text_source,
        extractedFields=[
            ExtractedField(label="Filename", value=document.filename),
            ExtractedField(label="Source kind", value=document.sourceKind),
            ExtractedField(label="MIME type", value=document.mimeType),
            ExtractedField(label="Size", value=f"{document.sizeBytes} bytes"),
            ExtractedField(label="Text source", value=text_source),
            ExtractedField(
                label="Native PDF text",
                value="available" if text_source == "native_pdf" else "not detected",
            ),
        ],
        suggestedActions=[
            "Improve OCR quality and add multilingual language packs for tougher scans.",
            "Generate embeddings once parsed text is available.",
            "Surface confidence scores for extracted fields in the review UI.",
        ],
    )


@app.post("/documents/process", response_model=ProcessDocumentResponse)
def process_document(payload: ProcessDocumentRequest) -> ProcessDocumentResponse:
    document = payload.document

    if document.status == "uploaded":
        return ProcessDocumentResponse(
            nextStatus="queued",
            lastEvent="AI service acknowledged the upload and placed the document in the ingestion queue.",
            analysis=None,
        )

    if document.status == "queued":
        return ProcessDocumentResponse(
            nextStatus="processing",
            lastEvent="AI service started a mock parsing pass and prepared a preliminary analysis snapshot.",
            analysis=build_analysis(document),
        )

    if document.status == "processing":
        return ProcessDocumentResponse(
            nextStatus="ready",
            lastEvent="AI service completed the mock document pass and marked the record as review-ready.",
            analysis=build_analysis(document),
        )

    if document.status == "failed":
        return ProcessDocumentResponse(
            nextStatus="queued",
            lastEvent="AI service scheduled the failed document for a retry.",
            analysis=None,
        )

    return ProcessDocumentResponse(
        nextStatus="ready",
        lastEvent="Document is already ready. No further state change was required.",
        analysis=build_analysis(document),
    )
