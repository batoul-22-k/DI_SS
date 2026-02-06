import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Calendar,
  ChevronDown,
  Database,
  Filter,
  Search,
  Target,
} from 'lucide-react';
import type { IngestMetadata, SearchResultItem } from '../types';
import { searchDocuments } from '../services/api';

interface SemanticSearchViewProps {
  documents: IngestMetadata[];
}

const DATE_OPTIONS = [
  { label: 'All Time', value: 'all' },
  { label: 'Last 7 Days', value: '7' },
  { label: 'Last 30 Days', value: '30' },
  { label: 'Last 90 Days', value: '90' },
];

const DOC_TYPES = [
  'Financial Reports',
  'Legal Contracts',
  'Internal SOPs',
  'Other',
];

const SemanticSearchView: React.FC<SemanticSearchViewProps> = ({ documents }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [minConfidence, setMinConfidence] = useState(0.1);
  const [dateRange, setDateRange] = useState('30');
  const [docTypeFilters, setDocTypeFilters] = useState<Record<string, boolean>>(
    () => Object.fromEntries(DOC_TYPES.map((t) => [t, true]))
  );

  const docMap = useMemo(() => {
    return new Map(documents.map((doc) => [doc.doc_id, doc]));
  }, [documents]);

  const classifyDocType = (filename: string) => {
    const name = filename.toLowerCase();
    if (/contract|agreement|legal/.test(name)) return 'Legal Contracts';
    if (/sop|procedure|policy|manual/.test(name)) return 'Internal SOPs';
    if (/report|financial|statement|balance|income/.test(name)) return 'Financial Reports';
    return 'Other';
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setIsSearching(true);
    setError(null);
    try {
      const data = await searchDocuments(trimmed, 8);
      setResults(data.results || []);
    } catch (err) {
      setError('Search failed. Check backend connectivity or index state.');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleToggleDocType = (type: string) => {
    setDocTypeFilters((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const handleResetFilters = () => {
    setMinConfidence(0.1);
    setDateRange('30');
    setDocTypeFilters(Object.fromEntries(DOC_TYPES.map((t) => [t, true])));
  };

  const formatSnippet = (text: string) => {
    const cleaned = text.replace(/\s+/g, ' ').trim();
    if (cleaned.length <= 220) return cleaned;
    return `${cleaned.slice(0, 220)}…`;
  };

  const filteredResults = useMemo(() => {
    const selectedTypes = Object.entries(docTypeFilters)
      .filter(([, enabled]) => enabled)
      .map(([type]) => type);

    return results.filter((res) => {
      if (res.score < minConfidence) return false;

      const docMeta = docMap.get(res.doc_id);
      if (dateRange !== 'all' && docMeta?.created_at) {
        const days = Number(dateRange);
        const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
        const createdAt = new Date(docMeta.created_at).getTime();
        if (!Number.isNaN(createdAt) && createdAt < cutoff) return false;
      }

      if (selectedTypes.length > 0) {
        const docName = docMeta?.original_filename || res.doc_id;
        const docType = classifyDocType(docName);
        if (!selectedTypes.includes(docType)) return false;
      }

      return true;
    });
  }, [results, minConfidence, dateRange, docTypeFilters, docMap]);

  return (
    <div className="h-full flex flex-col p-6 gap-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col gap-4">
        <label className="text-[11px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Target size={14} className="text-teal-600" />
          Semantic Vector Inquiry Engine
        </label>
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={20}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="E.g., 'What were our expansion strategies in the APAC region last year?'"
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
            />
          </div>
          <button
            type="submit"
            className="bg-slate-900 text-white px-8 py-3 rounded-xl font-semibold hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-lg shadow-slate-200"
          >
            {isSearching ? <span className="animate-spin">◌</span> : <Search size={18} />}
            EXECUTE
          </button>
        </form>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        <aside className="w-72 flex flex-col gap-4 flex-shrink-0">
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-[10px] font-mono text-slate-500 uppercase font-bold flex items-center gap-1">
                <Filter size={12} /> Filters
              </span>
              <button
                onClick={handleResetFilters}
                className="text-[10px] text-teal-600 font-bold hover:underline"
              >
                RESET
              </button>
            </div>

            <section className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                <Calendar size={14} className="text-slate-400" />
                Date Range
              </label>
              <div className="flex flex-col gap-2">
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="flex items-center justify-between px-3 py-2 border border-slate-200 rounded text-xs bg-white"
                >
                  {DATE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            <section className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                <Target size={14} className="text-slate-400" />
                Min. Confidence ({minConfidence.toFixed(2)})
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={minConfidence}
                onChange={(e) => setMinConfidence(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>0.1</span>
                <span>0.5</span>
                <span>0.9</span>
              </div>
            </section>

            <section className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                <Database size={14} className="text-slate-400" />
                Document Type
              </label>
              <div className="space-y-2">
                {DOC_TYPES.map((type, i) => (
                  <label key={i} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={docTypeFilters[type]}
                      onChange={() => handleToggleDocType(type)}
                      className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-xs text-slate-600 group-hover:text-slate-900 transition-colors">
                      {type}
                    </span>
                  </label>
                ))}
              </div>
            </section>
          </div>

          <div className="bg-teal-900 text-white rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[10px] font-mono opacity-60">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              INDEX STATUS
            </div>
            <p className="text-xs font-medium">
              FAISS index ready. {documents.length} documents available.
            </p>
            <div className="h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
              <div className="w-full h-full bg-teal-400"></div>
            </div>
          </div>
        </aside>

        <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest">
              Found {filteredResults.length} matches
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Sorted by:</span>
              <button className="font-semibold text-slate-900 flex items-center gap-1">
                Relevance Score <ChevronDown size={14} />
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 text-xs p-3 rounded">
              {error}
            </div>
          )}

          {!error && filteredResults.length === 0 && query.trim() && !isSearching && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 text-sm text-slate-500">
              No results returned. Try another query or adjust filters.
            </div>
          )}

          {filteredResults.map((res, i) => {
            const docMeta = docMap.get(res.doc_id);
            const docName = docMeta?.original_filename || res.doc_id;
            return (
              <div
                key={`${res.doc_id}-${res.page}-${i}`}
                className="bg-white border border-slate-200 rounded-xl p-5 hover:border-teal-500 transition-all cursor-pointer group shadow-sm"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                        {res.doc_id}
                      </span>
                      <h4 className="font-bold text-slate-800 group-hover:text-teal-700 transition-colors">
                        {docName}
                      </h4>
                    </div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono">
                      Retrieved from Page {res.page}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="text-teal-600 font-mono font-bold text-lg">
                      {(res.score * 100).toFixed(1)}%
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono">
                      COSINE_SIMILARITY
                    </span>
                  </div>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-4 line-clamp-2 italic">
                  &ldquo;{formatSnippet(res.text)}&rdquo;
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 bg-slate-50 border border-slate-100 rounded text-[9px] font-mono text-slate-500">
                      {res.source?.toUpperCase() || 'VECTOR_MATCH'}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-50 border border-slate-100 rounded text-[9px] font-mono text-slate-500">
                      PAGE {res.page}
                    </span>
                  </div>
                  <button className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-teal-600 uppercase tracking-wider">
                    View Document <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SemanticSearchView;
