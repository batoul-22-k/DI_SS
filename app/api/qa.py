"""Question answering (RAG-style) endpoints."""
from __future__ import annotations

import re
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from config.config import SETTINGS
from app.embeddings.embedder import embed_query
from app.vector_store.faiss_store import FaissVectorStore

router = APIRouter()


class QARequest(BaseModel):
    question: str = Field(..., min_length=1)
    top_k: Optional[int] = None


class QAContext(BaseModel):
    doc_id: str
    page: int
    chunk_index: int
    text: str
    score: float
    source: Optional[str] = None


class QAResponse(BaseModel):
    question: str
    answer: str
    contexts: List[QAContext]


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
                detail="Vector index not found. Run ingestion/indexing first.",
            ) from exc
        _store = store
    return _store


def clear_store() -> None:
    """Clear cached FAISS store so new data is loaded on next request."""
    global _store
    _store = None


def _tokenize(text: str) -> List[str]:
    return re.findall(r"[a-z0-9']+", text.lower())


def _best_sentence(text: str, question: str) -> str:
    cleaned = text.strip()
    if not cleaned:
        return ""

    sentences = re.split(r"(?<=[.!?])\s+", cleaned)
    q_tokens = set(_tokenize(question))

    best_sentence = ""
    best_score = -1

    for sent in sentences:
        tokens = set(_tokenize(sent))
        if not tokens:
            continue
        overlap = len(tokens & q_tokens)
        if overlap > best_score:
            best_score = overlap
            best_sentence = sent.strip()
        elif overlap == best_score and best_sentence:
            if len(sent) < len(best_sentence):
                best_sentence = sent.strip()

    if best_score <= 0:
        return cleaned[: SETTINGS.qa_max_chars].strip()

    return best_sentence[: SETTINGS.qa_max_chars].strip()


def _compose_answer(results: List[Dict[str, object]], question: str) -> str:
    """Compose an answer by selecting the best sentence from each top chunk."""
    sentences: List[str] = []
    for item in results:
        text = str(item.get("text", ""))
        sentence = _best_sentence(text, question)
        if sentence and sentence not in sentences:
            sentences.append(sentence)

    if not sentences:
        return ""

    max_chars = SETTINGS.qa_max_chars
    answer_parts: List[str] = []
    total = 0
    for sent in sentences:
        sent = sent.strip()
        if not sent:
            continue
        # Add a separator if we already have content.
        extra = 2 if answer_parts else 0
        if total + len(sent) + extra > max_chars:
            break
        if answer_parts:
            answer_parts.append("  ")
            total += 2
        answer_parts.append(sent)
        total += len(sent)

    return "".join(answer_parts).strip()


@router.post("/qa", response_model=QAResponse)
def qa(request: QARequest) -> QAResponse:
    """Answer a question using retrieved chunks only."""
    store = _get_store()
    top_k = request.top_k or SETTINGS.top_k
    query_vec = embed_query(request.question, normalize=True)

    results = store.search(query_vec, top_k=top_k)
    if not results:
        return QAResponse(
            question=request.question,
            answer="Answer not found in the provided documents.",
            contexts=[],
        )

    top_score = results[0].get("score", 0.0)
    if top_score < SETTINGS.qa_min_score:
        return QAResponse(
            question=request.question,
            answer="Answer not found in the provided documents.",
            contexts=[],
        )

    answer = _compose_answer(results, request.question)
    if not answer:
        answer = "Answer not found in the provided documents."

    parsed = [QAContext(**item) for item in results]
    return QAResponse(question=request.question, answer=answer, contexts=parsed)
