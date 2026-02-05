# Document Intelligence & Semantic Search Platform

A local-first Document Intelligence and Semantic Search system designed as a Master 2 mini-project. The platform ingests PDFs, improves OCR quality through image preprocessing, extracts text with lightweight layout structure, optionally runs Named Entity Recognition (NER), builds semantic embeddings, and enables semantic search over the indexed content.

The project emphasizes:
- End-to-end AI pipeline design
- Sound engineering decisions and modular components
- Reproducibility and stable demos
- Transparent limitations and honest trade-offs

## Architecture Overview

**Core flow**
1. PDF upload
2. PDF → images (PyMuPDF)
3. Image preprocessing (OpenCV)
4. OCR (PaddleOCR)
5. Optional NER (spaCy)
6. Chunking (block-aware)
7. Embeddings (SentenceTransformers)
8. Vector store (FAISS)
9. Semantic search via API

**Component boundaries**
- `app/preprocessing/` handles image cleanup
- `app/ocr/` handles PDF-to-image, OCR, and layout grouping
- `app/ner/` handles NER (toggleable)
- `app/embeddings/` handles chunking, embedding, indexing
- `app/vector_store/` handles FAISS index persistence
- `app/api/` handles ingestion and search endpoints
- `frontend/` is a static HTML UI for the demo

## Pipeline Diagram (Textual)
```
PDF Upload
   ↓
Ingestion (doc_id + metadata)
   ↓
PDF → Images → Preprocessing
   ↓
OCR (page text + lines + blocks)
   ↓
Optional NER
   ↓
Chunking (block-aware)
   ↓
Embeddings (MiniLM)
   ↓
FAISS Index (persisted to disk)
   ↓
Semantic Search API
```

## Project Structure
```
project/
│── app/
│   ├── main.py
│   ├── api/
│   ├── ocr/
│   ├── preprocessing/
│   ├── embeddings/
│   ├── vector_store/
│   ├── ner/
│   └── utils/
│── data/
│── frontend/
│── config/
│── README.md
```

## Setup Instructions

### 1. Create and activate a virtual environment
```bash
python -m venv .venv
. .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

### 2. Install Python dependencies
```bash
pip install fastapi uvicorn paddleocr pymupdf opencv-python sentence-transformers faiss-cpu spacy
```

### 3. Optional: Install a spaCy model (for NER)
```bash
python -m spacy download en_core_web_sm
```

### 4. Optional: Use Tesseract instead of PaddleOCR
This project defaults to PaddleOCR. If you want to experiment with Tesseract, you can add it separately and swap the OCR implementation.

## How to Run the Demo

### 1. Start the FastAPI backend
```bash
uvicorn app.main:app --reload
```

### 2. Open the HTML frontend
Open `frontend/index.html` in your browser. Ensure the API base URL points to `http://localhost:8000`.

### 3. Demo Flow
1. Upload a PDF → OCR + indexing happens immediately
2. Load OCR output to inspect text per page
3. Run semantic search and view top matching chunks

## Example Queries
- “data sharing agreement terms”
- “limitations of the proposed system”
- “date of publication”
- “organization name and address”

## Configuration
Environment variables (optional):
- `DI_ENABLE_NER=true` to enable NER
- `DI_CHUNK_SIZE=500`
- `DI_CHUNK_OVERLAP=80`
- `DI_TOP_K=5`
- `DI_PDF_DPI=200`
- `DI_PREPROCESS_DESKEW=true`
- `DI_BLOCK_Y_GAP=22`

## Limitations and Failure Cases
- **OCR errors**: Low-resolution scans, skewed pages, or poor contrast reduce text accuracy. Errors propagate to embeddings and search.
- **Layout preservation**: Block grouping is heuristic (gap-based). Complex layouts (tables, multi-column) can be mis-grouped.
- **Embedding limitations**: The MiniLM model may miss subtle context, domain-specific jargon, or long dependencies.
- **Semantic vs keyword search**: Semantic search can miss exact terms; keyword search can miss paraphrases. This system is semantic only.
- **Scalability**: FAISS IndexFlat scales in-memory and is not optimized for very large corpora or multi-user workloads.
- **Not production-ready**: No authentication, access controls, or robust error handling across edge cases.

## Ethical Considerations
- OCR and NER can amplify biases in training data.
- Extracted content can include sensitive information; this system stores everything locally to minimize exposure.
- Results are not guaranteed to be correct; human review is required for high-stakes decisions.

## Why This Is a Valid Academic Demo
- It demonstrates a full pipeline from raw PDFs to searchable embeddings.
- Each module is explainable and replaceable.
- The system is local, reproducible, and modular.
- Limitations are explicitly documented.

## License
This project is intended for academic use.
