"""FAISS vector store for embeddings and metadata."""
from __future__ import annotations

from pathlib import Path
from typing import Dict, List, Tuple

import faiss
import numpy as np

from app.utils.io import read_json, write_json
from app.utils.paths import ensure_dir


class FaissVectorStore:
    """Simple FAISS-backed store with JSON metadata persistence."""

    def __init__(self, dim: int = 384) -> None:
        self.dim = dim
        self.index = faiss.IndexFlatIP(dim)
        self.metadata: List[Dict[str, object]] = []

    def add(self, embeddings: np.ndarray, metadata: List[Dict[str, object]]) -> None:
        if embeddings.size == 0:
            return
        if embeddings.shape[1] != self.dim:
            raise ValueError(f"Expected dim {self.dim}, got {embeddings.shape[1]}")
        self.index.add(embeddings)
        self.metadata.extend(metadata)

    def search(self, query_vec: np.ndarray, top_k: int = 5) -> List[Dict[str, object]]:
        if query_vec.ndim == 1:
            query_vec = query_vec.reshape(1, -1)
        scores, indices = self.index.search(query_vec, top_k)

        results: List[Dict[str, object]] = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < 0 or idx >= len(self.metadata):
                continue
            item = dict(self.metadata[idx])
            item["score"] = float(score)
            results.append(item)
        return results

    def save(self, dir_path: Path) -> None:
        ensure_dir(dir_path)
        index_path = dir_path / "faiss.index"
        meta_path = dir_path / "metadata.json"
        faiss.write_index(self.index, str(index_path))
        write_json(meta_path, self.metadata)

    def load(self, dir_path: Path) -> None:
        index_path = dir_path / "faiss.index"
        meta_path = dir_path / "metadata.json"
        if not index_path.exists() or not meta_path.exists():
            raise FileNotFoundError("FAISS index or metadata not found")
        self.index = faiss.read_index(str(index_path))
        self.metadata = read_json(meta_path)
