"""Document text retrieval endpoints."""
from __future__ import annotations

from pathlib import Path
from typing import Dict, List

from fastapi import APIRouter, HTTPException

from config.config import SETTINGS
from app.utils.io import read_json

router = APIRouter()


@router.get("/documents")
def list_documents() -> List[Dict[str, object]]:
    """List ingested document metadata."""
    meta_dir = SETTINGS.metadata_dir
    if not meta_dir.exists():
        return []

    meta_paths = sorted(meta_dir.glob("*.json"))
    documents: List[Dict[str, object]] = [read_json(p) for p in meta_paths]
    documents.sort(key=lambda item: str(item.get("created_at", "")), reverse=True)
    return documents


@router.get("/documents/{doc_id}")
def get_document(doc_id: str) -> Dict[str, object]:
    """Return per-page OCR outputs for a document."""
    doc_dir = SETTINGS.extracted_text_dir / doc_id
    if not doc_dir.exists():
        raise HTTPException(status_code=404, detail="Document not found")

    page_paths = sorted(doc_dir.glob("page_*.json"))
    pages: List[Dict[str, object]] = [read_json(p) for p in page_paths]

    return {
        "doc_id": doc_id,
        "page_count": len(pages),
        "pages": pages,
    }
