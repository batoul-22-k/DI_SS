import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Database,
  FileText,
  History,
  Network,
  Server,
} from 'lucide-react';
import type { IngestMetadata } from '../types';
import { healthCheck } from '../services/api';

interface SystemStatusViewProps {
  documents: IngestMetadata[];
}

const SystemStatusView: React.FC<SystemStatusViewProps> = ({ documents }) => {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;
    healthCheck()
      .then((res) => {
        if (isMounted) setIsHealthy(res.status === 'ok');
      })
      .catch(() => {
        if (isMounted) setIsHealthy(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const summary = useMemo(() => {
    const totalDocs = documents.length;
    const totalPages = documents.reduce((sum, doc) => sum + doc.page_count, 0);
    const totalChunks = documents.reduce(
      (sum, doc) => sum + (doc.index?.chunks_added ?? 0),
      0
    );
    const lastIngest = documents[0]?.created_at || null;
    return { totalDocs, totalPages, totalChunks, lastIngest };
  }, [documents]);

  const statusLabel = isHealthy === null ? 'CHECKING' : isHealthy ? 'HEALTHY' : 'OFFLINE';
  const statusColor =
    isHealthy === null
      ? 'text-slate-400'
      : isHealthy
      ? 'text-green-600'
      : 'text-red-600';

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-12">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <Server className="text-teal-600" size={24} />
            <h2 className="text-2xl font-bold text-slate-800">
              Backend: <span className="text-teal-600">FastAPI</span>
            </h2>
          </div>
          <p className="text-slate-500 max-w-md">
            The document intelligence pipeline is running locally with OCR, embeddings, and FAISS indexing.
          </p>
        </div>

        <div className="flex gap-12">
          <div className="text-center space-y-1">
            <div className="text-3xl font-bold text-slate-800">
              {summary.totalDocs}
            </div>
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
              Documents
            </div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-3xl font-bold text-slate-800">
              {summary.totalPages}
            </div>
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
              Pages Indexed
            </div>
          </div>
          <div className={`text-center space-y-1 ${statusColor}`}>
            <div className="text-3xl font-bold flex items-center justify-center gap-2">
              {isHealthy ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
              {statusLabel}
            </div>
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
              API Health
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="space-y-4">
          <h3 className="text-xs font-mono text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
            <Activity size={14} className="text-teal-600" />
            Module Deployment Status
          </h3>
          <div className="space-y-3">
            {[
              { name: 'OCR_PIPELINE', icon: <Activity size={20} /> },
              { name: 'EMBEDDINGS', icon: <Network size={20} /> },
              { name: 'FAISS_INDEX', icon: <Database size={20} /> },
            ].map((module, i) => (
              <div
                key={i}
                className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isHealthy ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                    }`}
                  >
                    {module.icon}
                  </div>
                  <div>
                    <h4 className="font-mono text-xs font-bold text-slate-800">
                      {module.name}
                    </h4>
                    <span className="text-[10px] text-slate-400 uppercase">
                      Last Signal: {summary.lastIngest ? new Date(summary.lastIngest).toLocaleTimeString() : 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-end gap-1">
                    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-1000 bg-teal-500"
                        style={{ width: isHealthy ? '80%' : '10%' }}
                      ></div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      LOAD: {isHealthy ? 'LOW' : 'N/A'}
                    </span>
                  </div>
                  <div
                    className={`px-3 py-1 rounded text-[10px] font-bold ${
                      isHealthy ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {isHealthy ? 'HEALTHY' : 'UNKNOWN'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-mono text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
            <History size={14} className="text-teal-600" />
            Recent Activity
          </h3>
          <div className="bg-slate-900 rounded-xl p-4 font-mono text-[11px] h-[340px] overflow-y-auto space-y-1.5 text-slate-300">
            {[
              `INDEX: ${summary.totalChunks} chunks stored in FAISS`,
              `INGEST: ${summary.totalDocs} documents available`,
              `OCR: Last ingest at ${summary.lastIngest ? new Date(summary.lastIngest).toLocaleString() : 'N/A'}`,
              `API: Health status ${statusLabel}`,
            ].map((msg, i) => (
              <div key={i} className="flex gap-3 p-1 rounded">
                <span className="text-slate-500 flex-shrink-0 shrink-0">LOG</span>
                <span className="text-slate-200 truncate">{msg}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { icon: <FileText size={18} />, label: 'Total Documents', value: String(summary.totalDocs) },
          { icon: <Activity size={18} />, label: 'Total Pages', value: String(summary.totalPages) },
          { icon: <Database size={18} />, label: 'Chunks Added', value: String(summary.totalChunks) },
          { icon: <Clock size={18} />, label: 'Last Ingest', value: summary.lastIngest ? new Date(summary.lastIngest).toLocaleTimeString() : 'N/A' },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-slate-50 text-slate-500 rounded-lg">{stat.icon}</div>
              <span className="text-[10px] font-bold text-teal-600">LIVE</span>
            </div>
            <div className="text-2xl font-bold text-slate-800">{stat.value}</div>
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              {stat.label}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default SystemStatusView;
