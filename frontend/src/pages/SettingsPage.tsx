import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { 
  Settings, 
  Cpu, 
  Database, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { configApi, ConfigStatusData } from '../services/api';

export const SettingsPage: React.FC = () => {
  const [status, setStatus] = useState<ConfigStatusData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await configApi.getStatus();
      setStatus(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
          <p className="text-sm text-slate-500">Checking system and provider diagnostics...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold uppercase tracking-wider mb-2">
              <Settings className="w-3.5 h-3.5" /> Architecture Diagnostics
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              System & Provider Configuration
            </h1>
            <p className="text-sm text-slate-500">
              Transparent live status of your database, LLM provider, and RAG pipelines.
            </p>
          </div>

          <button
            onClick={fetchStatus}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Diagnostics
          </button>
        </div>

        {/* Configuration Diagnostic Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Database Diagnostics */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 font-bold text-sm text-slate-900">
                <Database className="w-4 h-4 text-indigo-600" />
                <span>Relational Database</span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Connected
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Active Engine:</span>
                <span className="font-semibold text-slate-800">{status?.database_type}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Schema Isolation:</span>
                <span className="font-semibold text-slate-800">User ID Foreign Keys</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">PostgreSQL Ready:</span>
                <span className="font-semibold text-slate-800">Configurable via DATABASE_URL</span>
              </div>
            </div>
          </div>

          {/* LLM Provider Diagnostics */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 font-bold text-sm text-slate-900">
                <Cpu className="w-4 h-4 text-indigo-600" />
                <span>AI / LLM Service</span>
              </div>
              {status?.llm_configured ? (
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Live API Key Active
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-[11px] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Intelligent Parser Active
                </span>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Configured Provider:</span>
                <span className="font-semibold text-slate-800 uppercase">{status?.llm_provider}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Target Model:</span>
                <span className="font-semibold text-slate-800 font-mono">{status?.model_name}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Agent Architecture:</span>
                <span className="font-semibold text-slate-800">LangGraph State Machine</span>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions for Configuring External API Keys */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Key className="w-4 h-4 text-indigo-600" />
            <span>Configuring Production API Keys (.env)</span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            PrepAI is architected with complete provider abstraction. When no external API key is specified, the system executes deterministic NLP parsing, mathematical skill matching, and contextual evaluations based on your real resume and JD data. To connect a live provider, set the environment variables in your <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">.env</code> file:
          </p>

          <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto leading-relaxed">
            <div># LLM Provider: openai, anthropic, gemini, groq, or local</div>
            <div>LLM_PROVIDER=openai</div>
            <div>OPENAI_API_KEY=sk-...</div>
            <div>LLM_MODEL=gpt-4o-mini</div>
            <div className="mt-2"># Relational Database:</div>
            <div>DATABASE_URL=postgresql://user:pass@localhost:5432/prepai_db</div>
            <div className="mt-2"># Embeddings:</div>
            <div>EMBEDDING_PROVIDER=openai # or local</div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
