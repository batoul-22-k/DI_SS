"""Ingestion workflow: save PDF, run OCR, and write metadata."""
from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Dict, List

from config.config import SETTINGS, PROJECT_ROOT
from app.embeddings.indexer import update_vector_store
from app.api.search import clear_store as clear_search_store
from app.api.qa import clear_store as clear_qa_store
from app.ocr.ocr_pipeline import run_ocr_pipeline
from app.utils.ids import make_doc_id
from app.utils.io import write_json
from app.utils.paths import ensure_dirs


def ingest_pdf_bytes(pdf_bytes: bytes, filename: str) -> Dict[str, object]:
    """Persist an uploaded PDF and run the OCR pipeline immediately."""
    ensure_dirs(
        [
            SETTINGS.raw_pdfs_dir,
            SETTINGS.images_dir,
            SETTINGS.extracted_text_dir,
            SETTINGS.metadata_dir,
            SETTINGS.vector_store_dir,
        ]
    )

    doc_id = make_doc_id()
    pdf_path = SETTINGS.raw_pdfs_dir / f"{doc_id}.pdf"
    pdf_path.write_bytes(pdf_bytes)

    ocr_outputs = run_ocr_pipeline(pdf_path, doc_id)
    index_stats = update_vector_store(ocr_outputs)
    clear_search_store()
    clear_qa_store()

    metadata = _build_metadata(
        doc_id=doc_id,
        filename=filename,
        pdf_path=pdf_path,
        ocr_outputs=ocr_outputs,
        index_stats=index_stats,
    )

    meta_path = SETTINGS.metadata_dir / f"{doc_id}.json"
    write_json(meta_path, metadata)

    return metadata


def ingest_pdf_path(pdf_path: Path) -> Dict[str, object]:
    """Ingest a PDF already on disk."""
    ensure_dirs(
        [
            SETTINGS.raw_pdfs_dir,
            SETTINGS.images_dir,
            SETTINGS.extracted_text_dir,
            SETTINGS.metadata_dir,
            SETTINGS.vector_store_dir,
        ]
    )

    doc_id = make_doc_id()
    target_path = SETTINGS.raw_pdfs_dir / f"{doc_id}.pdf"
    target_path.write_bytes(pdf_path.read_bytes())

    ocr_outputs = run_ocr_pipeline(target_path, doc_id)
    index_stats = update_vector_store(ocr_outputs)

    metadata = _build_metadata(
        doc_id=doc_id,
        filename=pdf_path.name,
        pdf_path=target_path,
        ocr_outputs=ocr_outputs,
        index_stats=index_stats,
    )

    meta_path = SETTINGS.metadata_dir / f"{doc_id}.json"
    write_json(meta_path, metadata)

    return metadata


def _build_metadata(
    doc_id: str,
    filename: str,
    pdf_path: Path,
    ocr_outputs: List[Path],
    index_stats: Dict[str, int],
) -> Dict[str, object]:
    return {
        "doc_id": doc_id,
        "original_filename": filename,
        "saved_pdf_path": _rel_path(pdf_path),
        "created_at": datetime.utcnow().isoformat() + "Z",
        "page_count": len(ocr_outputs),
        "ocr_output_paths": [_rel_path(p) for p in ocr_outputs],
        "ocr_engine": SETTINGS.ocr_engine,
        "pdf_render_dpi": SETTINGS.pdf_render_dpi,
        "preprocess_deskew": SETTINGS.preprocess_deskew,
        "block_y_gap": SETTINGS.block_y_gap,
        "index": index_stats,
    }


def _rel_path(path: Path) -> str:
    try:
        return str(path.relative_to(PROJECT_ROOT))
    except ValueError:
        return str(path)
