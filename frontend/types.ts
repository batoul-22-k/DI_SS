
export enum ViewType {
  DOCUMENTS = 'DOCUMENTS',
  SEMANTIC_SEARCH = 'SEMANTIC_SEARCH',
  OCR_METADATA = 'OCR_METADATA',
  SYSTEM_STATUS = 'SYSTEM_STATUS',
}

export interface IngestMetadata {
  doc_id: string;
  original_filename: string;
  created_at: string;
  page_count: number;
  ocr_engine: string;
  pdf_render_dpi: number;
  preprocess_deskew: boolean;
  block_y_gap: number;
  index: {
    chunks_added: number;
    total_chunks: number;
  };
}

export interface DocumentPage {
  doc_id: string;
  page: number;
  text: string;
  lines: {
    text: string;
    score: number;
    bbox: [number, number, number, number];
  }[];
  blocks: {
    block_index: number;
    text: string;
    bbox: [number, number, number, number];
    line_count: number;
  }[];
  entities: {
    text: string;
    label: string;
    start_char: number;
    end_char: number;
  }[];
  image_path: string;
  preprocessed_image_path: string;
}

export interface DocumentPayload {
  doc_id: string;
  page_count: number;
  pages: DocumentPage[];
}

export interface SearchResultItem {
  doc_id: string;
  page: number;
  chunk_index: number;
  text: string;
  score: number;
  source?: string;
}

export interface SearchResponse {
  query: string;
  results: SearchResultItem[];
}

export interface QAContext {
  doc_id: string;
  page: number;
  chunk_index: number;
  text: string;
  score: number;
  source?: string;
}

export interface QAResponse {
  question: string;
  answer: string;
  contexts: QAContext[];
}
