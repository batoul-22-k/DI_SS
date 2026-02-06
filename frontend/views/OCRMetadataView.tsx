import React from 'react';
import {
  BarChart3,
  FileCheck2,
  Settings2,
  Terminal,
  Cpu,
} from 'lucide-react';
import type { IngestMetadata } from '../types';

interface OCRMetadataViewProps {
  documents: IngestMetadata[];
}

const OCRMetadataView: React.FC<OCRMetadataViewProps> = ({ documents }) => {
  const totalDocs = documents.length;
  const totalPages = documents.reduce((sum, doc) => sum + doc.page_count, 0);
  const totalChunks = documents.reduce(
    (sum, doc) => sum + (doc.index?.chunks_added ?? 0),
    0
  );

  return (
    <div className="p-6 h-full flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-teal-50 rounded-lg flex items-center justify-center text-teal-600">
            <FileCheck2 size={24} />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase">
              Documents Indexed
            </div>
            <div className="text-2xl font-bold text-slate-800">{totalDocs}</div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
            <Cpu size={24} />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase">
              Total Pages
            </div>
            <div className="text-2xl font-bold text-slate-800">{totalPages}</div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
            <BarChart3 size={24} />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase">
              Chunks Added
            </div>
            <div className="text-2xl font-bold text-slate-800">{totalChunks}</div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl flex-1 overflow-hidden flex flex-col shadow-sm">
        <header className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <Terminal size={18} className="text-slate-400" />
            <h3 className="font-semibold text-slate-800">
              Extraction Log & Metadata Registry
            </h3>
          </div>
          <div className="flex gap-2">
            <button className="p-1.5 hover:bg-slate-200 rounded transition-colors text-slate-400">
              <Settings2 size={16} />
            </button>
            <button className="p-1.5 hover:bg-slate-200 rounded transition-colors text-slate-400">
              <BarChart3 size={16} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          {documents.length === 0 ? (
            <div className="p-8 text-sm text-slate-500">
              No metadata available yet. Ingest a PDF to populate this view.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-mono text-slate-500 uppercase sticky top-0">
                  <th className="px-6 py-3">Doc Identifier</th>
                  <th className="px-6 py-3">OCR Engine</th>
                  <th className="px-6 py-3">Pages</th>
                  <th className="px-6 py-3">Created At</th>
                  <th className="px-6 py-3">PDF DPI</th>
                  <th className="px-6 py-3">Chunks Added</th>
                </tr>
              </thead>
              <tbody className="text-[11px] font-mono divide-y divide-slate-100">
                {documents.map((doc) => (
                  <tr key={doc.doc_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">{doc.doc_id}</td>
                    <td className="px-6 py-4 text-slate-500">{doc.ocr_engine}</td>
                    <td className="px-6 py-4 text-slate-600">{doc.page_count}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(doc.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{doc.pdf_render_dpi}</td>
                    <td className="px-6 py-4 font-bold text-teal-600">
                      {doc.index?.chunks_added ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default OCRMetadataView;
