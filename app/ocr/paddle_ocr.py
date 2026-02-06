"""PaddleOCR wrapper for text extraction."""
from __future__ import annotations

import os
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# Work around OneDNN/PIR executor issues on some Paddle builds.
# Allow environment overrides if the user has already set these.
os.environ.setdefault("FLAGS_use_mkldnn", "0")
os.environ.setdefault("FLAGS_enable_pir", "0")
os.environ.setdefault("FLAGS_enable_mkldnn", "0")
os.environ.setdefault("FLAGS_enable_pir_api", "0")
os.environ.setdefault("FLAGS_use_pir_api", "0")
os.environ.setdefault("FLAGS_enable_new_ir", "0")
os.environ.setdefault("FLAGS_use_new_ir", "0")
os.environ.setdefault("FLAGS_new_executor", "0")
os.environ.setdefault("FLAGS_use_new_executor", "0")

from paddleocr import PaddleOCR

_ocr_engine: Optional[PaddleOCR] = None


def get_ocr_engine() -> PaddleOCR:
    global _ocr_engine
    if _ocr_engine is None:
        try:
            import paddle  # type: ignore

            paddle.set_flags(
                {
                    "FLAGS_use_mkldnn": False,
                    "FLAGS_enable_mkldnn": False,
                    "FLAGS_enable_pir": False,
                    "FLAGS_enable_pir_api": False,
                    "FLAGS_use_pir_api": False,
                    "FLAGS_enable_new_ir": False,
                    "FLAGS_use_new_ir": False,
                    "FLAGS_new_executor": False,
                    "FLAGS_use_new_executor": False,
                }
            )
            paddle.set_device("cpu")
        except Exception:
            # Paddle may not be importable or flags may not exist for this build.
            pass
        _ocr_engine = PaddleOCR(use_angle_cls=True, lang="en")
    return _ocr_engine


def ocr_image(image_path: Path) -> Dict[str, object]:
    """Run OCR on a single image and return text and line details."""
    engine = get_ocr_engine()
    # Newer PaddleOCR pipeline versions don't accept the `cls` kwarg on predict/ocr.
    result = engine.ocr(str(image_path))

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
