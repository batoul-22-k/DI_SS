
import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  Search, 
  Database, 
  Activity, 
  ChevronRight, 
  ChevronLeft, 
  PanelRightClose, 
  PanelRightOpen,
  MessageSquareQuote
} from 'lucide-react';
import { IngestMetadata, ViewType } from './types';
import SidebarItem from './components/SidebarItem';
import RAGPanel from './components/RAGPanel';
import DocumentsView from './views/DocumentsView';
import SemanticSearchView from './views/SemanticSearchView';
import OCRMetadataView from './views/OCRMetadataView';
import SystemStatusView from './views/SystemStatusView';
import { loadDocuments, saveDocuments } from './services/storage';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>(ViewType.DOCUMENTS);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isRAGPanelOpen, setIsRAGPanelOpen] = useState(true);
  const [documents, setDocuments] = useState<IngestMetadata[]>(() => loadDocuments());

  useEffect(() => {
    saveDocuments(documents);
  }, [documents]);

  return (
    <div className="flex h-screen overflow-hidden text-sm">
      {/* Sidebar */}
      <aside 
        className={`bg-white border-r border-slate-200 transition-all duration-300 flex flex-col flex-shrink-0 ${
          isSidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-teal-600 rounded flex items-center justify-center text-white">
                <FileText size={18} />
              </div>
              <span className="font-semibold text-slate-900 tracking-tight">DOC<span className="text-[10px] text-teal-600 font-mono">AI</span></span>
            </div>
          )}
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 hover:bg-slate-100 rounded text-slate-500"
          >
            {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <SidebarItem 
            icon={<FileText size={18} />} 
            label="Documents" 
            isActive={activeView === ViewType.DOCUMENTS} 
            isCollapsed={isSidebarCollapsed}
            onClick={() => setActiveView(ViewType.DOCUMENTS)}
          />
          <SidebarItem 
            icon={<Search size={18} />} 
            label="Semantic Search" 
            isActive={activeView === ViewType.SEMANTIC_SEARCH} 
            isCollapsed={isSidebarCollapsed}
            onClick={() => setActiveView(ViewType.SEMANTIC_SEARCH)}
          />
          <SidebarItem 
            icon={<Database size={18} />} 
            label="OCR & Metadata" 
            isActive={activeView === ViewType.OCR_METADATA} 
            isCollapsed={isSidebarCollapsed}
            onClick={() => setActiveView(ViewType.OCR_METADATA)}
          />
          <SidebarItem 
            icon={<Activity size={18} />} 
            label="System Status" 
            isActive={activeView === ViewType.SYSTEM_STATUS} 
            isCollapsed={isSidebarCollapsed}
            onClick={() => setActiveView(ViewType.SYSTEM_STATUS)}
          />
        </nav>

        <div className="p-4 border-t border-slate-200 bg-slate-50">
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs font-medium text-slate-600">RESEARCH NODE_04 ACTIVE</span>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#f8f9fb]">
        {/* Dynamic Header */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 flex-shrink-0">
          <div>
            <h1 className="text-lg font-semibold text-slate-900 capitalize">
              {activeView.replace('_', ' ')}
            </h1>
            <p className="text-xs text-slate-500 font-mono uppercase">
              DocIntel // Internal Research Console // {new Date().toLocaleDateString()}
            </p>
          </div>
          <button 
            onClick={() => setIsRAGPanelOpen(!isRAGPanelOpen)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded border transition-colors ${
              isRAGPanelOpen 
              ? 'bg-teal-50 border-teal-200 text-teal-700' 
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <MessageSquareQuote size={16} />
            <span className="font-medium">RAG RESEARCHER</span>
            {isRAGPanelOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {activeView === ViewType.DOCUMENTS && (
            <DocumentsView documents={documents} onDocumentsChange={setDocuments} />
          )}
          {activeView === ViewType.SEMANTIC_SEARCH && (
            <SemanticSearchView documents={documents} />
          )}
          {activeView === ViewType.OCR_METADATA && (
            <OCRMetadataView documents={documents} />
          )}
          {activeView === ViewType.SYSTEM_STATUS && (
            <SystemStatusView documents={documents} />
          )}
        </div>
      </main>

      {/* Right Slide-out RAG Panel */}
      <RAGPanel isOpen={isRAGPanelOpen} onClose={() => setIsRAGPanelOpen(false)} />
    </div>
  );
};

export default App;
