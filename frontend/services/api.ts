import type {
  DocumentPayload,
  IngestMetadata,
  QAResponse,
  SearchResponse,
} from '../types';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.toString().trim() || 'http://localhost:8000';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function healthCheck(): Promise<{ status: string }> {
  const response = await fetch(`${API_BASE_URL}/health`);
  return handleResponse(response);
}

export async function ingestPdf(file: File): Promise<IngestMetadata> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${API_BASE_URL}/ingest`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse(response);
}

export async function searchDocuments(
  query: string,
  topK = 5
): Promise<SearchResponse> {
  const response = await fetch(`${API_BASE_URL}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, top_k: topK }),
  });
  return handleResponse(response);
}

export async function askQuestion(
  question: string,
  topK = 5
): Promise<QAResponse> {
  const response = await fetch(`${API_BASE_URL}/qa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, top_k: topK }),
  });
  return handleResponse(response);
}

export async function fetchDocument(docId: string): Promise<DocumentPayload> {
  const response = await fetch(`${API_BASE_URL}/documents/${docId}`);
  return handleResponse(response);
}

export async function listDocuments(): Promise<IngestMetadata[]> {
  const response = await fetch(`${API_BASE_URL}/documents`);
  return handleResponse(response);
}
