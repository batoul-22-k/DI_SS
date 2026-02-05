"""FastAPI application entrypoint."""
from __future__ import annotations

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.api.ingest import ingest_pdf_bytes
from app.api.search import router as search_router
from app.api.documents import router as documents_router
from app.api.qa import router as qa_router

app = FastAPI(title="Document Intelligence & Semantic Search")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/ingest")
def ingest(file: UploadFile = File(...)) -> dict:
    if not file.filename.lower().endswith(".pdf"):
        return {"error": "Only PDF uploads are supported."}

    payload = ingest_pdf_bytes(file.file.read(), file.filename)
    return payload


app.include_router(search_router)
app.include_router(documents_router)
app.include_router(qa_router)
