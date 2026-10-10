import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { 
  TrendingUp, 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  Mic, 
  Clock, 
  ArrowRight, 
  Loader2,
  BarChart3
} from 'lucide-react';
import { progressApi, ProgressSummaryData } from '../services/api';

export const ProgressPage: React.FC = () => {
  const [data, setData] = useState<ProgressSummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await progressApi.getProgress();
        setData(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
          <p className="text-sm text-slate-500">Compiling your performance progress...</p>
        </div>
      </Layout>
    );
  }

  const hasInterviews = data && data.interviews_completed > 0;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-2">
              <TrendingUp className="w-3.5 h-3.5" /> Preparation Analytics
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Progress & Readiness Tracking
            </h1>
            <p className="text-sm text-slate-500">
              Objective interview metrics derived from your actual simulated interview sessions.
            </p>
          </div>

          <Link
            to="/mock-interview/setup"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition"
          >
            <Mic className="w-4 h-4" />
            New Practice Session
          </Link>
        </div>

        {/* Top 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completed Sessions</span>
            <div className="text-3xl font-extrabold text-slate-900 font-mono">
              {data?.interviews_completed || 0}
            </div>
            <p className="text-xs text-slate-400">Total simulated interviews</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Average Score</span>
            <div className="text-3xl font-extrabold text-indigo-600 font-mono">
              {data?.average_interview_score ? `${data.average_interview_score} / 10` : '—'}
            </div>
            <p className="text-xs text-slate-400">Mean cross-topic performance</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Study Plan Completion</span>
            <div className="text-3xl font-extrabold text-emerald-600 font-mono">
              {data?.plan_progress_percent ? `${data.plan_progress_percent}%` : '0%'}
            </div>
            <p className="text-xs text-slate-400">{data?.topics_completed || 0} topics mastered</p>
          </div>
        </div>

        {/* Performance Score Trend */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Score History Over Time</h2>
              <p className="text-xs text-slate-500">Tracking interview quality across rounds</p>
            </div>
          </div>

          {hasInterviews && data?.score_history && data.score_history.length > 0 ? (
            <div className="space-y-4">
              <div className="h-40 flex items-end gap-3 pt-6 px-2">
                {data.score_history.map((item, idx) => {
                  const heightPercent = Math.max(15, (item.score / 10) * 100);
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                      <span className="text-[11px] font-mono font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition">
                        {item.score}
                      </span>
                      <div className="w-full bg-slate-100 rounded-t-lg h-28 flex items-end overflow-hidden">
                        <div
                          className="w-full bg-indigo-600 rounded-t-lg transition-all duration-500 group-hover:bg-indigo-700"
                          style={{ height: `${heightPercent}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono truncate max-w-full">
                        {item.date}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400 space-y-2">
              <BarChart3 className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-600 text-sm">No interview records yet</p>
              <p>Complete your first interview to start tracking your progress over time.</p>
              <div className="pt-2">
                <Link
                  to="/mock-interview/setup"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition"
                >
                  Start First Interview
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Competencies Breakdown: Strong vs Weak */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strong Skills */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Consistently Strong Domains
            </h3>
            {data?.strong_skills && data.strong_skills.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {data.strong_skills.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No validated strengths yet. Complete mock rounds to establish baseline.</p>
            )}
          </div>

          {/* Weak Topics */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Identified Focus Areas & Weak Spots
            </h3>
            {data?.weak_topics && data.weak_topics.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {data.weak_topics.map((w, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium"
                  >
                    {w}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No persistent weaknesses flagged. Keep testing advanced topics.</p>
            )}
          </div>
        </div>

        {/* Previous Interview Sessions History Table */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">Recent Interview Sessions</h2>
          {hasInterviews && data?.recent_interviews && data.recent_interviews.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {data.recent_interviews.map((item) => (
                <div key={item.id} className="py-3.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{item.target_role}</span>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {item.interview_type} • {item.difficulty} •{' '}
                      {item.completed_at ? new Date(item.completed_at).toLocaleDateString() : 'Recent'}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono font-bold text-indigo-600 text-sm">
                      {item.overall_score} / 10
                    </span>
                    <Link
                      to={`/mock-interview/${item.id}/summary`}
                      className="text-xs font-semibold text-slate-600 hover:text-indigo-600 flex items-center gap-1"
                    >
                      Scorecard <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              No interview sessions recorded yet.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
