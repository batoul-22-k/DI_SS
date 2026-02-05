"""Layout helpers for basic block-level grouping."""
from __future__ import annotations

from typing import Dict, List, Tuple


def box_to_bbox(box: List[List[float]]) -> Tuple[int, int, int, int]:
    """Convert PaddleOCR quadrilateral box to (x_min, y_min, x_max, y_max)."""
    xs = [pt[0] for pt in box]
    ys = [pt[1] for pt in box]
    return (int(min(xs)), int(min(ys)), int(max(xs)), int(max(ys)))


def group_lines_into_blocks(
    lines: List[Dict[str, object]], y_gap: int = 22
) -> List[Dict[str, object]]:
    """Group OCR lines into rough blocks using vertical gaps.

    This is a simple heuristic suitable for demos and explainability.
    """
    if not lines:
        return []

    sorted_lines = sorted(lines, key=lambda l: l["bbox"][1])
    blocks: List[List[Dict[str, object]]] = []
    current: List[Dict[str, object]] = [sorted_lines[0]]

    for line in sorted_lines[1:]:
        prev = current[-1]
        prev_bottom = prev["bbox"][3]
        curr_top = line["bbox"][1]
        if curr_top - prev_bottom > y_gap:
            blocks.append(current)
            current = [line]
        else:
            current.append(line)

    blocks.append(current)

    block_payloads: List[Dict[str, object]] = []
    for block_index, block_lines in enumerate(blocks):
        xs = [ln["bbox"][0] for ln in block_lines] + [ln["bbox"][2] for ln in block_lines]
        ys = [ln["bbox"][1] for ln in block_lines] + [ln["bbox"][3] for ln in block_lines]
        bbox = (int(min(xs)), int(min(ys)), int(max(xs)), int(max(ys))))
        text = "\n".join(str(ln["text"]) for ln in block_lines).strip()
        block_payloads.append(
            {
                "block_index": block_index,
                "text": text,
                "bbox": bbox,
                "line_count": len(block_lines),
                "lines": block_lines,
            }
        )

    return block_payloads
