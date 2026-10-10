import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { 
  Calendar, 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  Loader2, 
  BookOpen, 
  ArrowRight,
  RefreshCw,
  Award
} from 'lucide-react';
import { plansApi, PreparationPlanData, PlanTopic } from '../services/api';

export const PreparationPlanPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [plan, setPlan] = useState<PreparationPlanData | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const res = await plansApi.getCurrent();
        if (res.data) setPlan(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, []);

  const handleGeneratePlan = async () => {
    setGenerating(true);
    try {
      const res = await plansApi.generate({ duration_weeks: 4 });
      setPlan(res.data);
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Failed to generate preparation plan.');
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleTopic = async (topicId: string) => {
    setTogglingId(topicId);
    try {
      const res = await plansApi.toggleTopic(topicId);
      if (plan) {
        const updatedTopics = plan.topics.map((t) =>
          t.id === topicId ? { ...t, is_completed: res.data.is_completed } : t
        );
        setPlan({
          ...plan,
          completed_topics: res.data.completed_topics,
          progress_percentage: res.data.progress_percentage,
          topics: updatedTopics,
        });
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
          <p className="text-sm text-slate-500">Loading your personalized study plan...</p>
        </div>
      </Layout>
    );
  }

  // Group topics by week_number
  const topicsByWeek: { [week: number]: PlanTopic[] } = {};
  if (plan?.topics) {
    plan.topics.forEach((topic) => {
      if (!topicsByWeek[topic.week_number]) {
        topicsByWeek[topic.week_number] = [];
      }
      topicsByWeek[topic.week_number].push(topic);
    });
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-2">
              <Calendar className="w-3.5 h-3.5" /> Structured Roadmap
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Personalized Preparation Plan
            </h1>
            <p className="text-sm text-slate-500">
              {plan ? `Tailored ${plan.duration_weeks}-week curriculum targeting ${plan.target_role}` : 'Generate a curriculum based on your resume and skill gaps'}
            </p>
          </div>

          <div>
            <button
              onClick={handleGeneratePlan}
              disabled={generating}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition disabled:opacity-60"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Plan...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  {plan ? 'Regenerate Plan' : 'Generate Roadmap'}
                </>
              )}
            </button>
          </div>
        </div>

        {plan ? (
          <>
            {/* Progress Card */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Curriculum Progress</h3>
                  <p className="text-xs text-slate-500">
                    {plan.completed_topics} of {plan.total_topics} preparation topics marked complete
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-extrabold text-indigo-600 font-mono">
                    {plan.progress_percentage}%
                  </span>
                </div>
              </div>

              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${plan.progress_percentage}%` }}
                ></div>
              </div>

              {plan.overview && (
                <p className="text-xs text-slate-600 italic bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
                  "{plan.overview}"
                </p>
              )}
            </div>

            {/* Weeks Schedule */}
            <div className="space-y-6">
              {Object.keys(topicsByWeek).map((weekKey) => {
                const weekNum = Number(weekKey);
                const weekTopics = topicsByWeek[weekNum];
                const weekDone = weekTopics.filter((t) => t.is_completed).length;

                return (
                  <div key={weekNum} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 rounded bg-indigo-100 text-indigo-800 text-xs font-mono font-bold">
                          Week {weekNum}
                        </span>
                        <span className="font-bold text-sm text-slate-900">
                          {weekNum === 1 && 'Core Foundations & Primary Missing Skills'}
                          {weekNum === 2 && 'Data Persistence, Caching & Concurrency'}
                          {weekNum === 3 && 'High-Scale Distributed Architecture'}
                          {weekNum === 4 && 'Mock Interviews & Behavioral Mastery'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 font-medium">
                        {weekDone} / {weekTopics.length} done
                      </span>
                    </div>

                    <div className="p-6 divide-y divide-slate-100">
                      {weekTopics.map((topic) => {
                        const isToggling = togglingId === topic.id;
                        return (
                          <div
                            key={topic.id}
                            className={`py-4 first:pt-0 last:pb-0 flex items-start gap-4 transition ${
                              topic.is_completed ? 'opacity-80' : ''
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleToggleTopic(topic.id)}
                              disabled={isToggling}
                              className="mt-1 text-slate-400 hover:text-indigo-600 transition shrink-0"
                            >
                              {isToggling ? (
                                <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                              ) : topic.is_completed ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                              ) : (
                                <Circle className="w-5 h-5 text-slate-300" />
                              )}
                            </button>

                            <div className="flex-1 space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4
                                  className={`font-bold text-sm text-slate-900 ${
                                    topic.is_completed ? 'line-through text-slate-500' : ''
                                  }`}
                                >
                                  {topic.title}
                                </h4>
                                {topic.category && (
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold uppercase tracking-wider">
                                    {topic.category}
                                  </span>
                                )}
                              </div>

                              {topic.description && (
                                <p className="text-xs text-slate-600 leading-relaxed">
                                  {topic.description}
                                </p>
                              )}

                              {topic.key_concepts && topic.key_concepts.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {topic.key_concepts.map((kc, kIdx) => (
                                    <span
                                      key={kIdx}
                                      className="px-2 py-0.5 rounded bg-indigo-50/60 text-indigo-800 text-[11px] font-medium"
                                    >
                                      {kc}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {topic.recommended_resources && topic.recommended_resources.length > 0 && (
                                <div className="text-[11px] text-slate-500 pt-1 flex items-center gap-1.5">
                                  <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Resources: {topic.recommended_resources.join(' • ')}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center max-w-lg mx-auto space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">No Study Plan Generated Yet</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Generate a personalized study roadmap dynamically structured from your identified skill gaps and strengths.
            </p>
            <button
              onClick={handleGeneratePlan}
              disabled={generating}
              className="mt-2 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate My Preparation Roadmap
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};
