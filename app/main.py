"""FastAPI application entrypoint."""
from __future__ import annotations

import os

from pathlib import Path

# Ensure Paddle uses stable runtime defaults before any OCR imports.
os.environ.setdefault("FLAGS_use_mkldnn", "0")
os.environ.setdefault("FLAGS_enable_mkldnn", "0")
os.environ.setdefault("FLAGS_enable_pir", "0")
os.environ.setdefault("FLAGS_enable_pir_api", "0")
os.environ.setdefault("FLAGS_use_pir_api", "0")
os.environ.setdefault("FLAGS_enable_new_ir", "0")
os.environ.setdefault("FLAGS_use_new_ir", "0")
os.environ.setdefault("FLAGS_new_executor", "0")
os.environ.setdefault("FLAGS_use_new_executor", "0")

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

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

# Serve the built frontend if available.
BASE_DIR = Path(__file__).resolve().parents[1]
FRONTEND_DIST = BASE_DIR / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIST), html=True), name="frontend")
