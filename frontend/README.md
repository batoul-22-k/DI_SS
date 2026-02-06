# DocIntel Research Console (Frontend)

This frontend connects to the local FastAPI backend for ingestion, search, and RAG.

## Run Locally

1. Install dependencies:
   `npm install`
2. Start the frontend dev server:
   `npm run dev`
3. Start the backend in another terminal from the project root:
   `uvicorn app.main:app --reload`

## API Base URL

By default the frontend calls `http://localhost:8000`. To override, set `VITE_API_BASE_URL` before `npm run dev`.

Windows PowerShell:
`$env:VITE_API_BASE_URL = "http://localhost:8000"`
