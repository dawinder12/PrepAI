import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { 
  BookOpen, 
  Upload, 
  Search, 
  Loader2, 
  FileText, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  Database,
  ArrowRight
} from 'lucide-react';
import { ragApi } from '../services/api';

export const RAGDocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [topic, setTopic] = useState('System Design & Distributed Systems');
  const [error, setError] = useState<string | null>(null);

  // Search state
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[] | null>(null);

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    try {
      const res = await ragApi.getDocuments();
      setDocuments(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file (PDF, DOCX, TXT) to upload.');
      return;
    }
    setError(null);
    setUploading(true);

    try {
      await ragApi.uploadDocument(file, topic);
      setFile(null);
      await fetchDocs();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload and index document.');
    } finally {
      setUploading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    try {
      const res = await ragApi.queryKnowledge(query);
      setSearchResults(res.data.results);
    } catch (err: any) {
      alert('Semantic query failed.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-2">
              <Database className="w-3.5 h-3.5" /> RAG Knowledge Vault
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Study Material & Knowledge Retrieval
            </h1>
            <p className="text-sm text-slate-500">
              Upload your technical notes and documentation. Chunks are embedded and isolated strictly to your account.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>User-Isolated Vector Index</span>
          </div>
        </div>

        {/* Upload Form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">Index New Learning Document</h2>
          <p className="text-xs text-slate-500">
            Upload PDFs, DOCX, or notes to augment preparation context during mock interviews and study sessions.
          </p>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-5">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select File (PDF, DOCX, TXT)</label>
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>

            <div className="md:col-span-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Topic / Category</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. PostgreSQL Indexing"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="md:col-span-3">
              <button
                type="submit"
                disabled={uploading || !file}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Chunking & Embedding...
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    Index Document
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Semantic Query Testing Box */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">Query Your Indexed Knowledge Base</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Perform semantic cosine similarity searches across your indexed materials to test RAG retrieval.
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., How does write-ahead logging guarantee ACID compliance?"
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={searching}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition flex items-center gap-1.5"
            >
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search
            </button>
          </form>

          {/* Search results */}
          {searchResults && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Retrieved Context Chunks ({searchResults.length})
              </h3>
              {searchResults.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No matching document chunks found.</p>
              ) : (
                searchResults.map((r, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span className="font-semibold text-indigo-600">{r.document_filename} (Chunk #{r.chunk_index})</span>
                      <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold">
                        Cosine Sim: {r.similarity_score}
                      </span>
                    </div>
                    <p className="text-slate-700 font-serif leading-relaxed italic">
                      "{r.content}"
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Existing Documents List */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">Your Indexed Documents ({documents.length})</h2>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No custom study documents uploaded yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {documents.map((doc) => (
                <div key={doc.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <div>
                      <span className="font-semibold text-slate-800">{doc.filename}</span>
                      <span className="text-[11px] text-slate-400 ml-2">({doc.topic})</span>
                    </div>
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    {Math.round(doc.char_count / 1000)}k characters • {doc.file_type.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
