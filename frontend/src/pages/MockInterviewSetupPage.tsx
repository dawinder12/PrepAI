import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { 
  Mic, 
  Sparkles, 
  ArrowRight, 
  Loader2, 
  Briefcase, 
  Sliders, 
  HelpCircle,
  Cpu
} from 'lucide-react';
import { interviewsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const MockInterviewSetupPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [targetRole, setTargetRole] = useState(user?.target_role || 'Senior Backend Engineer');
  const [interviewType, setInterviewType] = useState('Technical');
  const [difficulty, setDifficulty] = useState('Mid');
  const [totalQuestions, setTotalQuestions] = useState(3);
  const [loading, setLoading] = useState(false);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await interviewsApi.start({
        target_role: targetRole,
        interview_type: interviewType,
        difficulty: difficulty,
        total_questions: totalQuestions,
      });
      navigate(`/mock-interview/${res.data.id}`);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to start interview session. Ensure you have an active session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto my-6 space-y-8">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-sm">
            <Mic className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Configure Your Mock Interview
          </h1>
          <p className="text-sm text-slate-500">
            Set your interview focus, seniority expectations, and question depth.
          </p>
        </div>

        <form onSubmit={handleStart} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          {/* Target Role */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Target Role
            </label>
            <input
              type="text"
              required
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Senior Backend Engineer"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Interview Type Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Interview Track
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {['Technical', 'System Design', 'Behavioral', 'Mixed'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setInterviewType(type)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition border ${
                    interviewType === type
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Level */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Seniority / Difficulty
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {['Junior', 'Mid', 'Senior', 'Lead'].map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setDifficulty(diff)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition border ${
                    difficulty === diff
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation Turns Count */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-heading">
              Interactive Dialogue Turns ({totalQuestions} Turns)
            </label>
            <input
              type="range"
              min={2}
              max={6}
              step={1}
              value={totalQuestions}
              onChange={(e) => setTotalQuestions(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-1">
              <span>2 (Focused Drill)</span>
              <span>3 (Standard Dialogue)</span>
              <span>6 (In-Depth Call)</span>
            </div>
          </div>

          {/* LangGraph & Voice Architecture Note */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-600" />
              What to expect in the interview room:
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              • The AI interviewer reads the question via speech synthesis. <br />
              • You can answer via browser microphone voice recognition or typed text. <br />
              • LangGraph evaluates your answer and dynamically adapts future questions.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Preparing Interview Room...
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                Enter Interview Room
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </Layout>
  );
};
