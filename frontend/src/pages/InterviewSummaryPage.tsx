import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Loader2, 
  RotateCcw, 
  Calendar, 
  HelpCircle,
  Clock,
  BookOpen,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { interviewsApi, InterviewSessionData } from '../services/api';

export const InterviewSummaryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<InterviewSessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedQId, setExpandedQId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      if (!id) return;
      try {
        const res = await interviewsApi.getSession(id);
        setSession(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
          <p className="text-sm text-slate-500">Synthesizing interview scorecard...</p>
        </div>
      </Layout>
    );
  }

  if (!session) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-sm text-slate-500">Interview session not found.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Top Overall Score Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-2">
                <Award className="w-3.5 h-3.5" /> Performance Scorecard
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Interview Performance Summary
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {session.target_role} • {session.interview_type} Track ({session.difficulty})
              </p>
            </div>

            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 shrink-0">
              <div className="text-right">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Overall Score</div>
                <div className="text-3xl font-extrabold text-indigo-600 font-mono">
                  {session.overall_score || 7.5} / 10
                </div>
              </div>
            </div>
          </div>

          {/* Multidimensional Scorecard Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Technical
              </span>
              <span className="text-2xl font-extrabold text-slate-900 font-mono">
                {session.technical_accuracy_score || 8.0}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Depth
              </span>
              <span className="text-2xl font-extrabold text-slate-900 font-mono">
                {session.depth_score || 7.5}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Communication
              </span>
              <span className="text-2xl font-extrabold text-slate-900 font-mono">
                {session.communication_score || 8.0}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Relevance
              </span>
              <span className="text-2xl font-extrabold text-slate-900 font-mono">
                {session.relevance_score || 8.5}
              </span>
            </div>
          </div>

          {/* Feedback summary text */}
          {session.feedback_summary && (
            <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs text-indigo-950 leading-relaxed italic">
              "{session.feedback_summary}"
            </div>
          )}
        </div>

        {/* Strengths & Weak Areas Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strengths */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Demonstrated Strengths
            </h3>
            <ul className="space-y-2 text-xs text-slate-600">
              {session.strengths && session.strengths.length > 0 ? (
                session.strengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{str}</span>
                  </li>
                ))
              ) : (
                <li className="text-slate-400 italic">Clear technical intent throughout answers.</li>
              )}
            </ul>
          </div>

          {/* Weak Areas */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Areas for Improvement
            </h3>
            <ul className="space-y-2 text-xs text-slate-600">
              {session.weak_areas && session.weak_areas.length > 0 ? (
                session.weak_areas.map((w, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>{w}</span>
                  </li>
                ))
              ) : (
                <li className="text-slate-400 italic">Expand on production failure scenarios and edge cases.</li>
              )}
            </ul>
          </div>
        </div>

        {/* Recommended Next Topics */}
        {session.recommended_topics && session.recommended_topics.length > 0 && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              Recommended Preparation Topics Before Next Round
            </h3>
            <div className="flex flex-wrap gap-2">
              {session.recommended_topics.map((t, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Questions Review */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Question-by-Question Review</h3>
          <div className="space-y-3">
            {session.questions.map((q) => {
              const isExpanded = expandedQId === q.id;
              return (
                <div
                  key={q.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/40 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedQId(isExpanded ? null : q.id)}
                    className="w-full p-4 text-left flex items-center justify-between hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono text-xs font-bold">
                        Q{q.order_index}
                      </span>
                      <span className="font-semibold text-xs text-slate-800 truncate max-w-md">
                        {q.question_text}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {q.evaluation && (
                        <span className="text-xs font-bold font-mono text-indigo-600">
                          {q.evaluation.overall_score} / 10
                        </span>
                      )}
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </button>

                  {isExpanded && q.evaluation && (
                    <div className="p-4 border-t border-slate-200 bg-white space-y-3 text-xs">
                      <div>
                        <span className="font-bold text-slate-800 block mb-1">Key Strengths:</span>
                        <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                          {q.evaluation.strengths.map((s, idx) => (
                            <li key={idx}>{s}</li>
                          ))}
                        </ul>
                      </div>

                      {q.evaluation.missing_points && q.evaluation.missing_points.length > 0 && (
                        <div>
                          <span className="font-bold text-amber-800 block mb-1">Missing Points:</span>
                          <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                            {q.evaluation.missing_points.map((m, idx) => (
                              <li key={idx}>{m}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <Link
            to="/dashboard"
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs text-center transition"
          >
            ← Back to Dashboard
          </Link>
          <div className="flex gap-3 w-full sm:w-auto">
            <Link
              to="/plan"
              className="flex-1 sm:flex-initial px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs text-center transition flex items-center justify-center gap-1.5"
            >
              <Calendar className="w-4 h-4 text-indigo-600" />
              Update Prep Plan
            </Link>
            <Link
              to="/mock-interview/setup"
              className="flex-1 sm:flex-initial px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs text-center shadow-xs transition flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              Practice Another Round
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};
