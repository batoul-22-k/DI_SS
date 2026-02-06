import React, { useState } from 'react';
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Info,
  Link2,
  Loader2,
  MessageSquareQuote,
  Send,
} from 'lucide-react';
import { askQuestion } from '../services/api';
import { QAResponse } from '../types';

interface RAGPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const RAGPanel: React.FC<RAGPanelProps> = ({ isOpen }) => {
  const [question, setQuestion] = useState('');
  const [topK, setTopK] = useState(3);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QAResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedContexts, setExpandedContexts] = useState(false);

  const handleAsk = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await askQuestion(question.trim(), topK);
      setResult(data);
    } catch (err) {
      setError('Failed to retrieve a grounded answer from the backend.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <aside className="w-96 bg-white border-l border-slate-200 flex flex-col h-full flex-shrink-0 animate-in slide-in-from-right duration-300">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2 uppercase tracking-widest text-xs">
          <Info size={14} className="text-teal-600" />
          Explainable RAG Researcher
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <section className="space-y-3">
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-slate-500 uppercase">
              Input Inquiry
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Query document corpus..."
              className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded text-sm resize-none focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <label className="text-[11px] font-mono text-slate-500 uppercase">
                Top-K
              </label>
              <select
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                className="bg-white border border-slate-200 rounded text-xs px-2 py-1 outline-none"
              >
                <option value={1}>1 Chunk</option>
                <option value={3}>3 Chunks</option>
                <option value={5}>5 Chunks</option>
                <option value={10}>10 Chunks</option>
              </select>
            </div>
            <button
              onClick={handleAsk}
              disabled={loading || !question.trim()}
              className="bg-teal-700 text-white px-4 py-1.5 rounded flex items-center gap-2 hover:bg-teal-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              <span className="font-medium text-xs">RESEARCH</span>
            </button>
          </div>
        </section>

        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded flex items-start gap-2 text-red-700 text-xs">
              <AlertCircle size={14} className="mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {loading && (
            <div className="space-y-4 animate-pulse">
              <div className="h-4 w-1/2 bg-slate-100 rounded"></div>
              <div className="space-y-2">
                <div className="h-3 bg-slate-100 rounded"></div>
                <div className="h-3 bg-slate-100 rounded"></div>
                <div className="h-3 w-4/5 bg-slate-100 rounded"></div>
              </div>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-4">
              <section className="space-y-2">
                <label className="text-[11px] font-mono text-slate-500 uppercase flex items-center gap-1">
                  Grounded Answer
                  <span className="px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded-full text-[9px] font-bold">
                    EXTRACTIVE
                  </span>
                </label>
                <div className="p-4 bg-teal-50/50 border border-teal-100 rounded-lg text-slate-700 leading-relaxed text-sm shadow-sm">
                  {result.answer}
                </div>
              </section>

              <section className="border-t border-slate-100 pt-4">
                <button
                  onClick={() => setExpandedContexts(!expandedContexts)}
                  className="w-full flex items-center justify-between text-[11px] font-mono text-slate-500 uppercase hover:text-slate-700 transition-colors"
                >
                  Show Retrieved Contexts ({result.contexts.length})
                  {expandedContexts ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {expandedContexts && (
                  <div className="mt-3 space-y-3">
                    {result.contexts.map((ctx, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white border border-slate-200 rounded shadow-sm text-xs space-y-2 hover:border-teal-200 transition-colors group"
                      >
                        <div className="flex items-center justify-between font-mono text-[10px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Link2 size={10} />
                            {ctx.doc_id} // Pg.{ctx.page}
                          </span>
                          <span className="text-teal-600 font-bold">
                            SCORE: {ctx.score.toFixed(4)}
                          </span>
                        </div>
                        <p className="text-slate-600 italic leading-relaxed line-clamp-4 group-hover:line-clamp-none transition-all">
                          &ldquo;{ctx.text}&rdquo;
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {!result && !loading && !error && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-300 space-y-3 text-center">
              <MessageSquareQuote size={48} className="opacity-20" />
              <p className="text-xs max-w-[200px]">
                Enter a question to begin contextual research across document assets.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="p-3 border-t border-slate-200 bg-slate-50 text-[10px] text-slate-400 font-mono text-center">
        BACKEND: /qa (extractive answer)
      </div>
    </aside>
  );
};

export default RAGPanel;
