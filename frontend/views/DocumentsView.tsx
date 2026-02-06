import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Grid,
  List,
  Loader2,
  Maximize2,
  MoreHorizontal,
  Search,
  Upload,
} from 'lucide-react';
import type { DocumentPayload, IngestMetadata } from '../types';
import { fetchDocument, ingestPdf } from '../services/api';
import { upsertDocument } from '../services/storage';

interface DocumentsViewProps {
  documents: IngestMetadata[];
  onDocumentsChange: (next: IngestMetadata[]) => void;
}

const DocumentsView: React.FC<DocumentsViewProps> = ({
  documents,
  onDocumentsChange,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedDoc, setSelectedDoc] = useState<IngestMetadata | null>(null);
  const [filter, setFilter] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [docPayload, setDocPayload] = useState<DocumentPayload | null>(null);
  const [docError, setDocError] = useState<string | null>(null);
  const [isDocLoading, setIsDocLoading] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const filteredDocs = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    if (!needle) return documents;
    return documents.filter(
      (doc) =>
        doc.doc_id.toLowerCase().includes(needle) ||
        doc.original_filename.toLowerCase().includes(needle)
    );
  }, [documents, filter]);

  useEffect(() => {
    if (!selectedDoc) return;
    setIsDocLoading(true);
    setDocError(null);
    setDocPayload(null);
    setPageIndex(0);
    fetchDocument(selectedDoc.doc_id)
      .then((payload) => setDocPayload(payload))
      .catch(() =>
        setDocError('Unable to load OCR output for this document.')
      )
      .finally(() => setIsDocLoading(false));
  }, [selectedDoc]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Only PDF files are supported.');
      event.target.value = '';
      return;
    }
    setUploadError(null);
    setIsUploading(true);
    try {
      const metadata = await ingestPdf(file);
      const next = upsertDocument(documents, metadata);
      onDocumentsChange(next);
      setSelectedDoc(metadata);
    } catch (err) {
      setUploadError('Upload failed. Check backend connectivity.');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const currentPage = docPayload?.pages[pageIndex];
  const pageTotal = docPayload?.page_count ?? selectedDoc?.page_count ?? 0;

  const formatDate = (value: string) => {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
  };

  if (selectedDoc) {
    return (
      <div className="p-6 h-full flex flex-col gap-6 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedDoc(null)}
              className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {selectedDoc.original_filename}
              </h2>
              <div className="flex items-center gap-3 mt-1 text-xs font-mono text-slate-500">
                <span className="bg-slate-200 px-2 py-0.5 rounded text-slate-700">
                  {selectedDoc.doc_id}
                </span>
                <span className="flex items-center gap-1">
                  <FileText size={12} /> {selectedDoc.page_count} Pages
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} /> Ingested {formatDate(selectedDoc.created_at)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded text-xs font-medium hover:bg-slate-50">
              <Download size={14} /> Export OCR
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-medium hover:bg-slate-800">
              <Maximize2 size={14} /> Full Viewer
            </button>
          </div>
        </div>

        <div className="flex-1 flex gap-6 min-h-0">
          <div className="flex-[2] bg-white border border-slate-200 rounded-xl flex flex-col min-w-0">
            <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                Page Preview {pageIndex + 1} // {pageTotal || '--'}
              </span>
              <div className="flex items-center gap-3">
                <button
                  className="text-[10px] font-bold text-teal-600 hover:underline disabled:opacity-50"
                  disabled
                >
                  OCR LAYERS (API REQUIRED)
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-8 bg-slate-100 flex justify-center">
              <div className="bg-white shadow-xl relative w-full max-w-[620px] h-full min-h-[640px] flex-shrink-0 border border-slate-200">
                <div className="absolute inset-0 p-6 text-xs text-slate-500 font-mono overflow-auto whitespace-pre-wrap">
                  {isDocLoading && 'Loading OCR page text...'}
                  {!isDocLoading && docError && docError}
                  {!isDocLoading && !docError && currentPage?.text
                    ? currentPage.text
                    : !isDocLoading && !docError
                    ? 'No OCR text available for this page.'
                    : null}
                </div>
              </div>
            </div>
            <div className="border-t border-slate-200 px-4 py-3 flex items-center justify-between bg-white">
              <button
                onClick={() => setPageIndex((idx) => Math.max(0, idx - 1))}
                disabled={pageIndex === 0}
                className="flex items-center gap-2 text-xs font-medium text-slate-600 disabled:opacity-40"
              >
                <ArrowLeft size={14} /> Previous
              </button>
              <span className="text-[10px] font-mono text-slate-400">
                Page {pageIndex + 1} of {pageTotal || '--'}
              </span>
              <button
                onClick={() =>
                  setPageIndex((idx) =>
                    Math.min((pageTotal || 1) - 1, idx + 1)
                  )
                }
                disabled={pageIndex >= pageTotal - 1}
                className="flex items-center gap-2 text-xs font-medium text-slate-600 disabled:opacity-40"
              >
                Next <ArrowRight size={14} />
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-4 min-w-[280px]">
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col h-1/2">
              <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2 mb-3">
                Extracted Metadata
              </h3>
              <div className="space-y-3 overflow-y-auto pr-2">
                {[
                  { k: 'OCR Engine', v: selectedDoc.ocr_engine },
                  { k: 'PDF DPI', v: String(selectedDoc.pdf_render_dpi), mono: true },
                  {
                    k: 'Deskew',
                    v: selectedDoc.preprocess_deskew ? 'Enabled' : 'Disabled',
                  },
                  { k: 'Block Gap', v: String(selectedDoc.block_y_gap), mono: true },
                  {
                    k: 'Chunks Added',
                    v: String(selectedDoc.index?.chunks_added ?? 0),
                    mono: true,
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center py-1 border-b border-slate-50"
                  >
                    <span className="text-slate-400 text-[10px] uppercase font-mono">
                      {item.k}
                    </span>
                    <span
                      className={`text-slate-700 font-medium ${
                        item.mono ? 'font-mono' : ''
                      }`}
                    >
                      {item.v}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col h-1/2">
              <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2 mb-3">
                Detected Entities
              </h3>
              <div className="space-y-2 overflow-y-auto pr-2">
                {currentPage?.entities?.length ? (
                  currentPage.entities.map((item, i) => (
                    <div
                      key={i}
                      className="flex flex-col p-2 bg-slate-50 rounded border border-slate-100"
                    >
                      <span className="text-[9px] font-bold text-teal-600 font-mono">
                        {item.label}
                      </span>
                      <span className="text-slate-800 text-xs font-medium">
                        {item.text}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400">
                    No entities detected or NER is disabled.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search document names or IDs..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={handleUploadClick}
            disabled={isUploading}
            className="flex items-center gap-2 px-3 py-2 bg-teal-600 text-white rounded-lg text-xs font-semibold hover:bg-teal-700 disabled:opacity-60"
          >
            {isUploading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Upload size={14} />
            )}
            Upload PDF
          </button>
          <div className="flex items-center gap-2 border border-slate-200 rounded-lg p-1 bg-white">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'grid'
                  ? 'bg-slate-100 text-teal-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-slate-100 text-teal-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {uploadError && (
        <div className="bg-red-50 border border-red-100 text-red-700 text-xs p-3 rounded">
          {uploadError}
        </div>
      )}

      {!filteredDocs.length ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-500">
          No documents ingested yet. Upload a PDF to start indexing.
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {filteredDocs.map((doc) => (
            <div
              key={doc.doc_id}
              onClick={() => setSelectedDoc(doc)}
              className="group bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-teal-500 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="aspect-[3/4] bg-slate-100 relative overflow-hidden flex items-center justify-center text-slate-400">
                <FileText size={32} />
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ExternalLink size={24} className="text-white drop-shadow-md" />
                </div>
                <div className="absolute top-2 right-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm bg-green-100 text-green-700">
                    INDEXED
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-2">
                <h3
                  className="font-semibold text-slate-800 truncate"
                  title={doc.original_filename}
                >
                  {doc.original_filename}
                </h3>
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 uppercase">
                  <span>ID: {doc.doc_id}</span>
                  <span>{doc.page_count} Pages</span>
                </div>
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    INGESTED {formatDate(doc.created_at)}
                  </span>
                  <button className="text-slate-400 hover:text-teal-600">
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-mono text-slate-500 uppercase">
                <th className="px-6 py-3 font-semibold">Document Name</th>
                <th className="px-6 py-3 font-semibold">Asset ID</th>
                <th className="px-6 py-3 font-semibold text-center">Pages</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Ingestion Date</th>
                <th className="px-6 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {filteredDocs.map((doc) => (
                <tr
                  key={doc.doc_id}
                  onClick={() => setSelectedDoc(doc)}
                  className="hover:bg-slate-50 cursor-pointer transition-colors group"
                >
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className="w-8 h-10 bg-slate-100 rounded flex-shrink-0 flex items-center justify-center group-hover:bg-teal-50 transition-colors">
                      <FileText
                        size={16}
                        className="text-slate-400 group-hover:text-teal-600"
                      />
                    </div>
                    <span className="font-medium text-slate-700 truncate max-w-xs">
                      {doc.original_filename}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                      {doc.doc_id}
                    </code>
                  </td>
                  <td className="px-6 py-4 text-center font-mono text-slate-500">
                    {doc.page_count}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                      INDEXED
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {formatDate(doc.created_at)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-1 hover:bg-slate-200 rounded transition-colors text-slate-400">
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DocumentsView;
