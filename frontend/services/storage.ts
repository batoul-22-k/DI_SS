import type { IngestMetadata } from '../types';

const STORAGE_KEY = 'docintel.documents.v1';

export function loadDocuments(): IngestMetadata[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as IngestMetadata[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDocuments(documents: IngestMetadata[]): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
}

export function upsertDocument(
  documents: IngestMetadata[],
  doc: IngestMetadata
): IngestMetadata[] {
  const next = documents.filter((item) => item.doc_id !== doc.doc_id);
  next.push(doc);
  next.sort((a, b) => b.created_at.localeCompare(a.created_at));
  return next;
}
