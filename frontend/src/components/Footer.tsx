import React from 'react';
import { Sparkles, Shield, Cpu, Database } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-bold text-lg text-slate-900">
                Prep<span className="text-indigo-600">AI</span>
              </span>
            </div>
            <p className="text-sm text-slate-600 max-w-sm leading-relaxed">
              Full-stack AI-powered technical interview preparation. Analyze skill gaps against real job postings, master customized study roadmaps, and practice in adaptive mock interview environments.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500 pt-2">
              <span className="inline-flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-emerald-600" /> Isolated User Data
              </span>
              <span className="inline-flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-indigo-600" /> LangGraph Orchestration
              </span>
              <span className="inline-flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-blue-600" /> Relational + Vector Storage
              </span>
            </div>
          </div>

          {/* Product links */}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><a href="#features" className="hover:text-indigo-600 transition">Resume & JD Parser</a></li>
              <li><a href="#features" className="hover:text-indigo-600 transition">Skill Gap Analyzer</a></li>
              <li><a href="#features" className="hover:text-indigo-600 transition">Personalized Study Plan</a></li>
              <li><a href="#features" className="hover:text-indigo-600 transition">Voice Mock Interview</a></li>
              <li><a href="#features" className="hover:text-indigo-600 transition">RAG Knowledge Base</a></li>
            </ul>
          </div>

          {/* System & Architecture */}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">Architecture</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><span className="text-slate-500">Backend:</span> FastAPI + SQLAlchemy</li>
              <li><span className="text-slate-500">Agent:</span> LangGraph Workflow</li>
              <li><span className="text-slate-500">RAG:</span> Cosine Vector Embeddings</li>
              <li><span className="text-slate-500">Voice:</span> Web Speech STT & TTS</li>
              <li><span className="text-slate-500">Status:</span> Operational</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} PrepAI. Designed for rigorous technical interview preparation.</p>
          <div className="flex gap-6">
            <span>Production-Quality Architecture</span>
            <span>Zero Mock Statistics</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
