"""Indexing pipeline: page JSONs -> chunks -> embeddings -> FAISS."""
from __future__ import annotations

from pathlib import Path
from typing import Dict, Iterable, List

from config.config import SETTINGS
from app.embeddings.chunking import chunk_pages
from app.embeddings.embedder import embed_texts
from app.utils.io import read_json
from app.vector_store.faiss_store import FaissVectorStore


def load_page_payloads(page_paths: Iterable[Path]) -> List[Dict[str, object]]:
    return [read_json(path) for path in page_paths]


def update_vector_store(page_paths: Iterable[Path]) -> Dict[str, int]:
    """Add new pages to the FAISS index and persist to disk."""
    page_payloads = load_page_payloads(page_paths)
    chunks = chunk_pages(
        page_payloads,
        chunk_size=SETTINGS.chunk_size,
        overlap=SETTINGS.chunk_overlap,
    )

    embeddings, metadata = embed_texts(chunks, normalize=True)

    store = FaissVectorStore()
    try:
        store.load(SETTINGS.vector_store_dir)
    except FileNotFoundError:
        pass

    store.add(embeddings, metadata)
    store.save(SETTINGS.vector_store_dir)

    return {
        "chunks_added": len(metadata),
        "total_chunks": len(store.metadata),
    }
