"""Project configuration settings.

These defaults can be overridden with environment variables.
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import os

PROJECT_ROOT = Path(__file__).resolve().parents[1]


def _env_bool(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "y"}


def _env_float(name: str, default: float) -> float:
    raw = os.getenv(name)
    if raw is None:
        return default
    try:
        return float(raw)
    except ValueError:
        return default


@dataclass(frozen=True)
class Settings:
    # Core paths
    data_dir: Path = PROJECT_ROOT / "data"
    raw_pdfs_dir: Path = data_dir / "raw_pdfs"
    images_dir: Path = data_dir / "images"
    extracted_text_dir: Path = data_dir / "extracted_text"
    metadata_dir: Path = data_dir / "metadata"
    vector_store_dir: Path = data_dir / "vector_store"

    # Pipeline toggles
    ocr_engine: str = os.getenv("DI_OCR_ENGINE", "paddleocr")
    enable_ner: bool = _env_bool("DI_ENABLE_NER", False)

    # OCR and preprocessing
    pdf_render_dpi: int = int(os.getenv("DI_PDF_DPI", "200"))
    preprocess_deskew: bool = _env_bool("DI_PREPROCESS_DESKEW", True)

    # Layout grouping
    block_y_gap: int = int(os.getenv("DI_BLOCK_Y_GAP", "22"))

    # Chunking and retrieval
    chunk_size: int = int(os.getenv("DI_CHUNK_SIZE", "500"))
    chunk_overlap: int = int(os.getenv("DI_CHUNK_OVERLAP", "80"))
    top_k: int = int(os.getenv("DI_TOP_K", "5"))

    # QA behavior
    qa_min_score: float = _env_float("DI_QA_MIN_SCORE", 0.2)
    qa_max_chars: int = int(os.getenv("DI_QA_MAX_CHARS", "400"))


SETTINGS = Settings()
