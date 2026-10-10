import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { 
  GitCompare, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ArrowRight, 
  Loader2, 
  Calendar, 
  Mic, 
  BookOpen,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { analysisApi, SkillGapData } from '../services/api';

export const SkillGapPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [skillGap, setSkillGap] = useState<SkillGapData | null>(null);
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);

  useEffect(() => {
    const fetchSkillGap = async () => {
      try {
        const res = await analysisApi.getLatestSkillGap();
        if (res.data) {
          setSkillGap(res.data);
          if (res.data.missing_skills.length > 0) {
            setExpandedSkill(res.data.missing_skills[0].skill);
          }
        }
      } catch (err) {
        console.error('Failed to load skill gap:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSkillGap();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
          <p className="text-sm text-slate-500">Calculating your candidate-to-job match matrix...</p>
        </div>
      </Layout>
    );
  }

  if (!skillGap) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <GitCompare className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">No Skill Gap Analysis Available Yet</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Upload your resume and provide a target job posting to compute your alignment score, identify missing technical requirements, and formulate preparation priorities.
          </p>
          <div className="pt-2">
            <Link
              to="/profile-job"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition"
            >
              Upload Resume & Add Job Target
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Top Header & Match Summary Banner */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-2">
              <GitCompare className="w-3.5 h-3.5" /> Alignment Matrix
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Candidate Skill Gap Analysis
            </h1>
            <p className="text-sm text-slate-500">
              Evaluated against your target role requirements and industry standards.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="text-right">
              <div className="text-xs uppercase tracking-wider font-bold text-slate-500">Match Score</div>
              <div className="text-3xl font-extrabold text-indigo-600 font-mono">
                {skillGap.match_score}%
              </div>
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-indigo-600 border-t-slate-200 flex items-center justify-center font-bold text-xs text-indigo-700">
              {Math.round(skillGap.match_score)}
            </div>
          </div>
        </div>

        {/* Action Priority Recommendations */}
        {skillGap.recommended_priorities && skillGap.recommended_priorities.length > 0 && (
          <div className="p-5 rounded-2xl border border-indigo-100 bg-indigo-50/40 space-y-3">
            <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              Recommended Preparation Priorities
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-700">
              {skillGap.recommended_priorities.map((pri, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-white/80 p-2.5 rounded-lg border border-indigo-100">
                  <span className="font-mono font-bold text-indigo-600 shrink-0">#{idx + 1}</span>
                  <span>{pri}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Three Columns / Breakdown: Strong Matches, Partial Matches, Missing Skills */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Strong Matches */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Strong Matches</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold font-mono">
                {skillGap.strong_matches.length}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Skills clearly present in your profile that satisfy required job competencies.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {skillGap.strong_matches.length > 0 ? (
                skillGap.strong_matches.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium"
                  >
                    {s}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">No exact matches detected</span>
              )}
            </div>
          </div>

          {/* Partial Matches */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Partial Matches</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-bold font-mono">
                {skillGap.partial_matches.length}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Related technologies in your background that share patterns with the JD.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {skillGap.partial_matches.length > 0 ? (
                skillGap.partial_matches.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium"
                  >
                    {s}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">No partial matches</span>
              )}
            </div>
          </div>

          {/* Missing Skills Count Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Missing Skills</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-xs font-bold font-mono">
                {skillGap.missing_skills.length}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Required specifications absent from your resume that will likely be probed during interviews.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {skillGap.missing_skills.length > 0 ? (
                skillGap.missing_skills.map((m, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md bg-rose-50 border border-rose-200 text-rose-900 text-xs font-medium"
                  >
                    {m.skill}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">Zero missing skills detected</span>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Missing Skill Breakdown with Explanations & Study Topics */}
        {skillGap.missing_skills.length > 0 && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Missing Competencies: Detailed Breakdown</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Understand the rationale for each gap and recommended topics to study.
              </p>
            </div>

            <div className="space-y-3">
              {skillGap.missing_skills.map((item, idx) => {
                const isExpanded = expandedSkill === item.skill;
                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50/30 transition"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedSkill(isExpanded ? null : item.skill)}
                      className="w-full p-4 text-left flex items-center justify-between hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm text-slate-900">{item.skill}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            item.importance === 'High'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.importance} Importance
                        </span>
                      </div>
                      <div className="text-slate-400">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 border-t border-slate-200/60 bg-white space-y-3 text-xs">
                        <div>
                          <span className="font-semibold text-slate-700 block mb-0.5">Evaluation Rationale:</span>
                          <p className="text-slate-600 leading-relaxed">{item.reason}</p>
                        </div>

                        {item.recommended_topics && item.recommended_topics.length > 0 && (
                          <div>
                            <span className="font-semibold text-slate-700 block mb-1.5">
                              Recommended Topics to Master:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {item.recommended_topics.map((top, tIdx) => (
                                <span
                                  key={tIdx}
                                  className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 text-[11px] font-medium"
                                >
                                  {top}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Call to Action Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900 to-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
          <div className="space-y-1">
            <h3 className="text-lg font-bold">Ready to close these skill gaps?</h3>
            <p className="text-xs text-slate-300 max-w-md">
              Generate a personalized 4-week study plan targeting these exact missing topics, or jump straight into an AI mock interview.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/plan"
              className="px-5 py-2.5 rounded-xl bg-white text-indigo-950 font-semibold text-xs hover:bg-slate-100 transition flex items-center gap-1.5 shadow-sm"
            >
              <Calendar className="w-4 h-4 text-indigo-600" />
              Generate Study Plan
            </Link>
            <Link
              to="/mock-interview/setup"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-500 transition flex items-center gap-1.5 shadow-sm"
            >
              <Mic className="w-4 h-4" />
              Practice Mock Interview
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};
