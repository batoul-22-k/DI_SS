"""spaCy NER extraction utilities."""
from __future__ import annotations

from typing import Dict, List, Optional, Any

_model: Optional[Any] = None


def get_ner_model(model_name: str = "en_core_web_sm"):
    global _model
    if _model is None:
        try:
            import spacy  # type: ignore
        except ImportError as exc:
            raise RuntimeError(
                "spaCy is not installed. Install it or disable NER via DI_ENABLE_NER=false."
            ) from exc
        _model = spacy.load(model_name)
    return _model


def extract_entities(text: str) -> List[Dict[str, object]]:
    """Extract PERSON, ORG, DATE, GPE/LOC entities from text."""
    if not text.strip():
        return []

    nlp = get_ner_model()
    doc = nlp(text)

    wanted = {"PERSON", "ORG", "DATE", "GPE", "LOC"}
    entities: List[Dict[str, object]] = []

    for ent in doc.ents:
        if ent.label_ in wanted:
            entities.append(
                {
                    "text": ent.text,
                    "label": ent.label_,
                    "start_char": ent.start_char,
                    "end_char": ent.end_char,
                }
            )

    return entities
