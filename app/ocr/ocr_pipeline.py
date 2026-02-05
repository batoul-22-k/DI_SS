"""OCR pipeline: PDF -> images -> preprocess -> OCR -> JSON per page."""
from __future__ import annotations

from pathlib import Path
from typing import Dict, List

from config.config import SETTINGS, PROJECT_ROOT
from app.ocr.pdf_to_images import pdf_to_images
from app.ocr.paddle_ocr import ocr_image
from app.ocr.layout import box_to_bbox, group_lines_into_blocks
from app.preprocessing.image_preprocess import load_image, preprocess_image, save_image
from app.utils.paths import ensure_dir
from app.utils.io import write_json
from app.ner.ner import extract_entities


def run_ocr_pipeline(pdf_path: Path, doc_id: str) -> List[Path]:
    """Run OCR for a PDF and store per-page JSON outputs."""
    raw_dir = ensure_dir(SETTINGS.images_dir / doc_id / "raw")
    pre_dir = ensure_dir(SETTINGS.images_dir / doc_id / "preprocessed")
    out_dir = ensure_dir(SETTINGS.extracted_text_dir / doc_id)

    image_paths = pdf_to_images(pdf_path, raw_dir, dpi=SETTINGS.pdf_render_dpi)

    outputs: List[Path] = []
    for page_index, image_path in enumerate(image_paths, start=1):
        image_bgr = load_image(str(image_path))
        cleaned = preprocess_image(image_bgr, deskew=SETTINGS.preprocess_deskew)

        pre_path = pre_dir / image_path.name
        save_image(str(pre_path), cleaned)

        ocr_payload = ocr_image(pre_path)
        lines: List[Dict[str, object]] = []

        for detail in ocr_payload.get("details", []):
            box = detail.get("box")
            if not box:
                continue
            bbox = box_to_bbox(box)
            lines.append(
                {
                    "text": detail.get("text", ""),
                    "score": detail.get("score", 0.0),
                    "bbox": bbox,
                }
            )

        blocks = group_lines_into_blocks(lines, y_gap=SETTINGS.block_y_gap)
        entities = extract_entities(ocr_payload.get("text", "")) if SETTINGS.enable_ner else []

        page_json = {
            "doc_id": doc_id,
            "page": page_index,
            "text": ocr_payload.get("text", ""),
            "lines": lines,
            "blocks": blocks,
            "entities": entities,
            "image_path": _rel_path(image_path),
            "preprocessed_image_path": _rel_path(pre_path),
        }

        out_path = out_dir / f"page_{page_index:04d}.json"
        write_json(out_path, page_json)
        outputs.append(out_path)

    return outputs


def _rel_path(path: Path) -> str:
    try:
        return str(path.relative_to(PROJECT_ROOT))
    except ValueError:
        return str(path)
