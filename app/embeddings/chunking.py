"""Text chunking utilities with block-aware strategy."""
from __future__ import annotations

from typing import Dict, Iterable, List


def chunk_text(text: str, chunk_size: int, overlap: int) -> List[str]:
    """Split text into overlapping chunks by character length."""
    cleaned = text.strip()
    if not cleaned:
        return []

    chunks: List[str] = []
    start = 0
    while start < len(cleaned):
        end = min(start + chunk_size, len(cleaned))
        chunk = cleaned[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end == len(cleaned):
            break
        start = max(0, end - overlap)

    return chunks


def chunk_page_payload(
    page_payload: Dict[str, object], chunk_size: int, overlap: int
) -> List[Dict[str, object]]:
    """Chunk a single page payload, preferring block boundaries."""
    doc_id = str(page_payload.get("doc_id", ""))
    page_num = int(page_payload.get("page", 0))

    block_chunks: List[Dict[str, object]] = []
    blocks = page_payload.get("blocks", [])

    if isinstance(blocks, list) and blocks:
        for block in blocks:
            text = str(block.get("text", "")).strip()
            if not text:
                continue
            for chunk in chunk_text(text, chunk_size, overlap):
                block_chunks.append(
                    {
                        "doc_id": doc_id,
                        "page": page_num,
                        "chunk_index": len(block_chunks),
                        "text": chunk,
                        "source": "block",
                    }
                )

    # Fallback to full page text if no blocks were usable.
    if not block_chunks:
        page_text = str(page_payload.get("text", "")).strip()
        for chunk in chunk_text(page_text, chunk_size, overlap):
            block_chunks.append(
                {
                    "doc_id": doc_id,
                    "page": page_num,
                    "chunk_index": len(block_chunks),
                    "text": chunk,
                    "source": "page",
                }
            )

    return block_chunks


def chunk_pages(
    page_payloads: Iterable[Dict[str, object]], chunk_size: int, overlap: int
) -> List[Dict[str, object]]:
    """Chunk a list of page payloads into a flat list of chunk records."""
    chunks: List[Dict[str, object]] = []
    for payload in page_payloads:
        chunks.extend(chunk_page_payload(payload, chunk_size, overlap))
    return chunks
