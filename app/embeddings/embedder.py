"""Embedding generation using sentence-transformers."""
from __future__ import annotations

from typing import Dict, Iterable, List, Optional, Tuple

import numpy as np
from sentence_transformers import SentenceTransformer

_model: Optional[SentenceTransformer] = None


def get_model(model_name: str = "all-MiniLM-L6-v2") -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(model_name)
    return _model


def embed_query(text: str, normalize: bool = True) -> np.ndarray:
    """Generate an embedding for a single query string."""
    cleaned = text.strip()
    if not cleaned:
        return np.zeros((1, 384), dtype="float32")

    model = get_model()
    embeddings = model.encode([cleaned], convert_to_numpy=True, show_progress_bar=False)

    if normalize:
        norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        embeddings = embeddings / norms

    return embeddings.astype("float32")


def embed_texts(
    chunks: Iterable[Dict[str, object]], normalize: bool = True
) -> Tuple[np.ndarray, List[Dict[str, object]]]:
    """Generate embeddings for chunk records.

    Returns a tuple of (embeddings_matrix, chunk_metadata_list).
    """
    chunk_list = list(chunks)
    texts = [str(c.get("text", "")) for c in chunk_list]

    if not texts:
        return np.zeros((0, 384), dtype="float32"), []

    model = get_model()
    embeddings = model.encode(texts, convert_to_numpy=True, show_progress_bar=False)

    if normalize:
        norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        embeddings = embeddings / norms

    return embeddings.astype("float32"), chunk_list
