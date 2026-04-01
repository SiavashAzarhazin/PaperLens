from fastapi import FastAPI

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
