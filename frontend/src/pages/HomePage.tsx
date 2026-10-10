import React from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  FileText, 
  GitCompare, 
  Calendar, 
  Mic, 
  BrainCircuit, 
  ShieldCheck, 
  Volume2, 
  BarChart3,
  HelpCircle,
  LayoutDashboard
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Layout fullWidth>
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28 border-b border-slate-200/80 bg-gradient-to-b from-white via-slate-50/50 to-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100/80 text-indigo-700 text-xs font-semibold tracking-wide uppercase mb-8 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            AI-POWERED INTERVIEW PREPARATION
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6 font-heading">
            Prepare smarter. <br />
            <span className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-600 bg-clip-text text-transparent">
              Interview better.
            </span>
          </h1>

          {/* Description */}
          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-slate-600 leading-relaxed mb-10">
            Upload your resume and the job you're targeting. PrepAI analyzes your profile, identifies skill gaps, creates a personalized study plan, and helps you practice with an AI interviewer.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-indigo-600 text-white font-semibold text-base hover:bg-indigo-700 shadow-md hover:shadow-lg transition duration-200"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/mock-interview/setup"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white text-slate-700 font-semibold text-base border border-slate-300/80 hover:bg-slate-50 hover:border-slate-400 shadow-sm transition duration-200"
                >
                  <Mic className="w-4 h-4 text-indigo-600" />
                  Live Mock Interview
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-indigo-600 text-white font-semibold text-base hover:bg-indigo-700 shadow-md hover:shadow-lg transition duration-200"
                >
                  Get Started Free
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white text-slate-700 font-semibold text-base border border-slate-300/80 hover:bg-slate-50 hover:border-slate-400 shadow-sm transition duration-200"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>

          {/* Key Product Attributes */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Real PDF / DOCX resume parsing
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> LangGraph adaptive state machine
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Browser voice recognition & speech
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Relational Postgres persistence
            </span>
          </div>
        </div>
      </section>

      {/* Product Preview Section */}
      <section className="py-20 bg-slate-50 border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              An actual interview room. Not a generic chat box.
            </h2>
            <p className="mt-2 text-slate-600 max-w-xl mx-auto">
              Experience the realistic mock interview dashboard designed for engineering rigor.
            </p>
          </div>

          {/* Interactive UI Mockup Card */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
            {/* Top Bar of Interview Room */}
            <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="text-sm font-semibold tracking-wide">AI Senior Technical Interviewer</span>
                <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                  Target: Senior Backend Engineer
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono text-slate-300">
                <span className="bg-slate-800 px-2.5 py-1 rounded">Question 2 of 5</span>
                <span className="text-amber-400">Elapsed: 04:18</span>
              </div>
            </div>

            {/* Main Interview Chamber View */}
            <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Current Question & Voice Input State */}
              <div className="lg:col-span-7 space-y-6">
                {/* Question Card */}
                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                      Distributed Systems & Caching
                    </span>
                    <button className="flex items-center gap-1 text-xs text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-200 hover:text-indigo-600">
                      <Volume2 className="w-3.5 h-3.5" /> Replay Question Audio
                    </button>
                  </div>
                  <p className="text-base font-semibold text-slate-900 leading-snug">
                    "When implementing Redis caching ahead of PostgreSQL, how do you handle cache invalidation during high-volume updates, and what measures mitigate the cache stampede problem?"
                  </p>
                </div>

                {/* Microphone / Answer Input State */}
                <div className="p-5 rounded-xl border border-indigo-200 bg-indigo-50/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                      <span className="text-xs font-semibold text-slate-800">Listening to candidate speech...</span>
                    </div>
                    <span className="text-xs text-indigo-700 font-mono">Web Speech API</span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-indigo-100 text-sm text-slate-800 min-h-[90px] font-sans leading-relaxed">
                    "I typically use a cache-aside pattern with probabilistic early expiration (XFetch algorithm) or mutex locks on miss to prevent dog-piling PostgreSQL. For invalidation, we emit CDC events from PostgreSQL write-ahead logs via Kafka to an asynchronous invalidator worker..."
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span>Word Count: 48 words</span>
                    <span className="text-emerald-600 font-medium">Clear voice input detected</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Structured AI Evaluation Output */}
              <div className="lg:col-span-5 bg-slate-50/80 rounded-xl p-5 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Instant AI Evaluation
                  </h3>
                  <div className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 text-xs font-bold font-mono">
                    Score: 8.8 / 10
                  </div>
                </div>

                {/* Radar / Metrics Breakdown */}
                <div className="space-y-2.5 text-xs">
                  <div>
                    <div className="flex justify-between font-medium text-slate-700 mb-1">
                      <span>Technical Accuracy</span>
                      <span className="font-mono text-indigo-600 font-bold">9.0 / 10</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: '90%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-medium text-slate-700 mb-1">
                      <span>Depth of Explanation</span>
                      <span className="font-mono text-indigo-600 font-bold">8.5 / 10</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-medium text-slate-700 mb-1">
                      <span>Communication & Clarity</span>
                      <span className="font-mono text-indigo-600 font-bold">9.0 / 10</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: '90%' }}></div>
                    </div>
                  </div>
                </div>

                {/* Strengths & Missing Points */}
                <div className="pt-2 border-t border-slate-200 space-y-2 text-xs">
                  <div>
                    <span className="font-semibold text-emerald-700 block mb-1">Key Strengths:</span>
                    <p className="text-slate-600">
                      • Specifically referenced mutex locking and probabilistic early expiration algorithms.
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-amber-700 block mb-1">Missing Points / Next Focus:</span>
                    <p className="text-slate-600">
                      • Consider mentioning TTL jitter to prevent simultaneous cache key expiration.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase">System Workflow</span>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mt-2">
              How PrepAI Works
            </h2>
            <p className="text-slate-600 mt-2 text-sm sm:text-base">
              A structured three-phase pipeline connecting your background with your target role.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 font-mono font-bold text-sm flex items-center justify-center mb-5">
                01
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Upload & Analyze</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Upload your resume (PDF or DOCX) and paste your target job description. PrepAI extracts structured candidate data and job requirements.
              </p>
              <div className="text-xs font-medium text-indigo-600 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> PDF/DOCX Parsing + NLP
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 font-mono font-bold text-sm flex items-center justify-center mb-5">
                02
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Get Your Plan</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                PrepAI runs skill gap analysis to highlight strong matches, partial matches, and critical missing skills, then builds a weekly study roadmap.
              </p>
              <div className="text-xs font-medium text-indigo-600 flex items-center gap-1">
                <GitCompare className="w-3.5 h-3.5" /> Weighted Gap Matrix
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 font-mono font-bold text-sm flex items-center justify-center mb-5">
                03
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Practice & Improve</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Practice in adaptive mock interviews with speech-to-text, receive structured evaluations across 4 dimensions, and review long-term progress.
              </p>
              <div className="text-xs font-medium text-indigo-600 flex items-center gap-1">
                <BrainCircuit className="w-3.5 h-3.5" /> LangGraph Agent Cycle
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="py-20 bg-slate-50 border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase">End-to-End Capabilities</span>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mt-2">
              Engineered for High-Stakes Technical Preparation
            </h2>
            <p className="text-slate-600 mt-2 text-sm sm:text-base">
              Every feature is built on top of a resilient database, structured AI workflows, and genuine user data.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border border-slate-200 bg-white">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Resume & JD Parsing</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Extracts contact details, experience items, education, and technical competencies into strict Pydantic models.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-white">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <GitCompare className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Skill Gap Matrix</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Separates strong competencies from partial family matches and missing requirements, assigning concrete learning priorities.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-white">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Dynamic Study Roadmap</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Multi-week plan with actionable topics, key concepts, recommended documentation, and interactive completion tracking.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-white">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <Mic className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Voice & Audio Interviews</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Uses the Web Speech API for real-time speech-to-text transcription and text-to-speech audio question playback.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-white">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">LangGraph State Machine</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Stateful agent workflow that evaluates responses and dynamically adapts subsequent question difficulty based on weak spots.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-white">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">RAG Knowledge Vault</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Upload your own cheat sheets and study notes with user-isolated vector similarity search across all topics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section (Honest & Real) */}
      <section id="pricing" className="py-20 bg-white border-b border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase">Transparent Access</span>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mt-2">
              Simple, Transparent Pricing
            </h2>
            <p className="text-slate-600 mt-2 text-sm">
              PrepAI is currently in active release. Full access to all platform features is open for testing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Community / Beta Plan */}
            <div className="p-8 rounded-2xl border-2 border-indigo-600 bg-white shadow-sm space-y-6 relative">
              <span className="absolute -top-3 right-6 bg-indigo-600 text-white text-[11px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                Current Access
              </span>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Developer Beta</h3>
                <p className="text-xs text-slate-500 mt-1">Full access to all platform features</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900">$0</span>
                  <span className="text-xs text-slate-500">/ free during testing</span>
                </div>
              </div>

              <ul className="space-y-3 text-sm text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Unlimited Resume & Job Uploads
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Full Skill Gap Analysis
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Personalized Preparation Roadmaps
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> LangGraph AI Mock Interviews
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Voice Input & Multidimensional Scoring
                </li>
              </ul>

              <Link
                to="/register"
                className="block text-center w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition"
              >
                Create Account
              </Link>
            </div>

            {/* Pro / Organization Plan Preview */}
            <div className="p-8 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Custom / Enterprise</h3>
                <p className="text-xs text-slate-500 mt-1">For universities & bootcamp cohorts</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900">Custom</span>
                </div>
              </div>

              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-slate-400" /> Dedicated LLM & vector deployment
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-slate-400" /> Cohort-wide analytics dashboard
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-slate-400" /> Custom interview rubrics & criteria
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-slate-400" /> Priority audio streaming pipeline
                </li>
              </ul>

              <a
                href="mailto:contact@prepai.local"
                className="block text-center w-full py-3 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition"
              >
                Inquire for Teams
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-slate-50 border-b border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase">Common Inquiries</span>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mt-2">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            <div className="p-6 rounded-xl border border-slate-200 bg-white">
              <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                Is my uploaded resume and data shared with third parties?
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                No. All candidate profiles, uploaded documents, and interview transcripts are strictly isolated by your user ID in the relational database. Documents in the RAG knowledge vault are only retrievable within your authenticated session.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-white">
              <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                How does the AI evaluate my interview responses?
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Answers are evaluated on four key axes: Technical Accuracy, Depth of Explanation, Relevance to Prompt, and Communication Structure. The system identifies key technical terms mentioned, detects missing architectural edge-cases, and returns actionable feedback.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-white">
              <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                Can I use voice to answer questions during mock interviews?
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Yes. The platform integrates with browser speech recognition for real-time voice transcription as well as text-to-speech for the AI interviewer to read questions out loud. You can also edit or type your answers directly if you prefer.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-white">
              <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                How does LangGraph coordinate the interview session?
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                LangGraph maintains the active interview state graph. After each answer is evaluated, the agent tracks which technical topics were weak and adaptively steers subsequent questions to probe those specific domains before generating the final scorecard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 bg-white text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-4">
            Ready to prepare with engineering precision?
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mb-8 max-w-xl mx-auto">
            Upload your resume, analyze your gap against target job descriptions, and begin your first mock interview in under two minutes.
          </p>
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base shadow-sm transition"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base shadow-sm transition"
            >
              Start Free Preparation
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </section>
    </Layout>
  );
};
