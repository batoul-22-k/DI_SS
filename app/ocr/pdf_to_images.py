"""PDF to image conversion using PyMuPDF (fitz)."""
from __future__ import annotations

from pathlib import Path
from typing import List

import fitz  # PyMuPDF

from app.utils.paths import ensure_dir


def pdf_to_images(pdf_path: Path, output_dir: Path, dpi: int = 200) -> List[Path]:
    """Render each PDF page to an image file and return the paths."""
    ensure_dir(output_dir)

    doc = fitz.open(pdf_path)
    zoom = dpi / 72.0
    matrix = fitz.Matrix(zoom, zoom)

    image_paths: List[Path] = []
    for page_index in range(len(doc)):
        page = doc.load_page(page_index)
        pix = page.get_pixmap(matrix=matrix)
        out_path = output_dir / f"page_{page_index + 1:04d}.png"
        pix.save(str(out_path))
        image_paths.append(out_path)

    doc.close()
    return image_paths
