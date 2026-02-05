"""PaddleOCR wrapper for text extraction."""
from __future__ import annotations

from pathlib import Path
from typing import Dict, List, Tuple

from paddleocr import PaddleOCR

_ocr_engine: PaddleOCR | None = None


def get_ocr_engine() -> PaddleOCR:
    global _ocr_engine
    if _ocr_engine is None:
        _ocr_engine = PaddleOCR(use_angle_cls=True, lang="en")
    return _ocr_engine


def ocr_image(image_path: Path) -> Dict[str, object]:
    """Run OCR on a single image and return text and line details."""
    engine = get_ocr_engine()
    result = engine.ocr(str(image_path), cls=True)

    lines: List[str] = []
    details: List[Dict[str, object]] = []

    # PaddleOCR returns list per image: [[box, (text, score)], ...]
    if result:
        page_lines = result[0] if isinstance(result[0], list) else result
        for item in page_lines:
            if len(item) < 2:
                continue
            box, (text, score) = item
            lines.append(text)
            details.append({"box": box, "text": text, "score": float(score)})

    return {
        "text": "\n".join(lines).strip(),
        "lines": lines,
        "details": details,
    }
