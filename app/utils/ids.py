"""Document ID generation."""
from __future__ import annotations

from datetime import datetime
import uuid


def make_doc_id(prefix: str = "doc") -> str:
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    token = uuid.uuid4().hex[:8]
    return f"{prefix}_{stamp}_{token}"
