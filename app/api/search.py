"""Search API endpoints."""
from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from config.config import SETTINGS
from app.embeddings.embedder import embed_query
from app.vector_store.faiss_store import FaissVectorStore

router = APIRouter()


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1)
    top_k: Optional[int] = None


class SearchResult(BaseModel):
    doc_id: str
    page: int
    chunk_index: int
    text: str
    score: float
    source: Optional[str] = None


class SearchResponse(BaseModel):
    query: str
    results: List[SearchResult]


_store: Optional[FaissVectorStore] = None


def _get_store() -> FaissVectorStore:
    global _store
    if _store is None:
        store = FaissVectorStore()
        try:
            store.load(SETTINGS.vector_store_dir)
        except FileNotFoundError as exc:
            raise HTTPException(
                status_code=404,
                detail="Vector index not found. Run indexing first.",
            ) from exc
        _store = store
    return _store


def clear_store() -> None:
    """Clear cached FAISS store so new data is loaded on next request."""
    global _store
    _store = None


@router.post("/search", response_model=SearchResponse)
def search(request: SearchRequest) -> SearchResponse:
    """Semantic search over embedded document chunks."""
    store = _get_store()
    top_k = request.top_k or SETTINGS.top_k
    query_vec = embed_query(request.query, normalize=True)

    results = store.search(query_vec, top_k=top_k)
    parsed = [SearchResult(**item) for item in results]
    return SearchResponse(query=request.query, results=parsed)
