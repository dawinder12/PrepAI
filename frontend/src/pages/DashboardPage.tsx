import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/Layout';
import { 
  FileText, 
  Briefcase, 
  GitCompare, 
  Calendar, 
  Mic, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Loader2,
  Clock,
  Award
} from 'lucide-react';
import { resumesApi, jobsApi, analysisApi, plansApi, progressApi, ProgressSummaryData } from '../services/api';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<ProgressSummaryData | null>(null);
  const [resumeData, setResumeData] = useState<any>(null);
  const [jobData, setJobData] = useState<any>(null);
  const [skillGap, setSkillGap] = useState<any>(null);
  const [planData, setPlanData] = useState<any>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [progRes, resRes, jobRes, gapRes, planRes] = await Promise.allSettled([
          progressApi.getProgress(),
          resumesApi.getLatest(),
          jobsApi.getLatest(),
          analysisApi.getLatestSkillGap(),
          plansApi.getCurrent(),
        ]);

        if (progRes.status === 'fulfilled') setProgress(progRes.value.data);
        if (resRes.status === 'fulfilled') setResumeData(resRes.value.data);
        if (jobRes.status === 'fulfilled') setJobData(jobRes.value.data);
        if (gapRes.status === 'fulfilled') setSkillGap(gapRes.value.data);
        if (planRes.status === 'fulfilled') setPlanData(planRes.value.data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
          <p className="text-sm text-slate-500">Loading your interview dashboard...</p>
        </div>
      </Layout>
    );
  }

  // Calculate interview readiness score (weighted synthesis)
  let readinessScore = 40;
  if (resumeData) readinessScore += 15;
  if (jobData) readinessScore += 15;
  if (skillGap?.match_score) readinessScore = Math.round((readinessScore + skillGap.match_score) / 2);
  if (progress?.average_interview_score) readinessScore = Math.round((readinessScore + progress.average_interview_score * 10) / 2);
  readinessScore = Math.min(100, Math.max(10, readinessScore));

  return (
    <Layout>
      {/* Welcome & Overview Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {user?.full_name || 'Candidate'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Targeting: <span className="font-semibold text-slate-800">{user?.target_role || 'Software Engineer'}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/mock-interview/setup"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition"
          >
            <Mic className="w-4 h-4" />
            Start Mock Interview
          </Link>
        </div>
      </div>

      {/* Main Grid: Status Cards & Readiness Gauge */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* Resume Status */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Resume Profile</span>
            <div className={`p-2 rounded-lg ${resumeData ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">
              {resumeData ? 'Uploaded & Analyzed' : 'No Resume Uploaded'}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              {resumeData ? `${resumeData.profile?.skills?.length || 0} skills detected` : 'Upload your resume to begin'}
            </p>
          </div>
          <Link
            to="/profile-job"
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 pt-1"
          >
            {resumeData ? 'View Parsed Profile' : 'Upload Resume'} <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Target Job Status */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Target Job</span>
            <div className={`p-2 rounded-lg ${jobData ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">
              {jobData ? jobData.title : 'No Job Configured'}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              {jobData ? `${jobData.required_skills?.length || 0} requirements mapped` : 'Add job description text'}
            </p>
          </div>
          <Link
            to="/profile-job"
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 pt-1"
          >
            {jobData ? 'Edit Target Job' : 'Add Job Description'} <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Skill Gap Status */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Skill Gap Match</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <GitCompare className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">
              {skillGap ? `${skillGap.match_score}% Match` : 'Not Analyzed'}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {skillGap ? `${skillGap.missing_skills?.length || 0} missing competencies` : 'Requires resume + job target'}
            </p>
          </div>
          <Link
            to="/skill-gap"
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 pt-1"
          >
            {skillGap ? 'Review Gap Details' : 'Run Gap Analysis'} <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Interview Readiness */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Readiness</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">{readinessScore}%</div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${readinessScore}%` }}
              ></div>
            </div>
          </div>
          <Link
            to="/progress"
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 pt-1"
          >
            Detailed Analytics <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Middle Row: Study Plan & Recent Interview Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (7 cols): Preparation Roadmap Progress */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Personalized Preparation Plan</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {planData ? `${planData.duration_weeks}-Week Curriculum for ${planData.target_role}` : 'Generate a plan based on your skill gaps'}
              </p>
            </div>
            <Link
              to="/plan"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              Full Plan <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {planData ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                <span>Completed: {planData.completed_topics} / {planData.total_topics} Topics</span>
                <span className="font-bold text-indigo-600">{planData.progress_percentage}% Done</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all"
                  style={{ width: `${planData.progress_percentage}%` }}
                ></div>
              </div>

              {/* Next upcoming topics */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Upcoming Topics</span>
                {planData.topics.slice(0, 3).map((topic: any) => (
                  <div
                    key={topic.id}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${topic.is_completed ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                      <div>
                        <div className="font-semibold text-slate-800">{topic.title}</div>
                        <div className="text-[11px] text-slate-500">Week {topic.week_number} • {topic.category || 'Core'}</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-medium text-slate-500">
                      {topic.is_completed ? 'Done' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-200">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No active preparation plan yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Generate a dynamic study roadmap mapped to your resume strengths and missing JD skills.
              </p>
              <Link
                to="/plan"
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition"
              >
                Generate Study Roadmap
              </Link>
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Recent Mock Interview Session */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Mock Interview</h2>
              <p className="text-xs text-slate-500 mt-0.5">Your latest simulated practice</p>
            </div>
            <Link
              to="/progress"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              History <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {progress && progress.recent_interviews && progress.recent_interviews.length > 0 ? (
            <div className="space-y-4">
              {(() => {
                const recent = progress.recent_interviews[0];
                return (
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">
                        {recent.interview_type} • {recent.difficulty}
                      </span>
                      <div className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-xs font-bold">
                        Score: {recent.overall_score} / 10
                      </div>
                    </div>
                    <div className="font-semibold text-sm text-slate-900">
                      {recent.target_role}
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {recent.completed_at ? new Date(recent.completed_at).toLocaleDateString() : 'Recent'}
                      </span>
                      <Link
                        to={`/mock-interview/${recent.id}/summary`}
                        className="text-indigo-600 font-semibold hover:text-indigo-700"
                      >
                        View Full Scorecard →
                      </Link>
                    </div>
                  </div>
                );
              })()}

              <div className="pt-2">
                <Link
                  to="/mock-interview/setup"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 text-slate-700 font-semibold text-xs transition"
                >
                  <Mic className="w-3.5 h-3.5 text-indigo-600" />
                  Practice Another Session
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-200">
              <Mic className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No interviews completed yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Step into the AI interview room to practice questions, test your voice responses, and receive objective evaluation scores.
              </p>
              <Link
                to="/mock-interview/setup"
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition"
              >
                Start First Mock Interview
              </Link>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
