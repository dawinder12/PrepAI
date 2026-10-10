import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { 
  FileText, 
  Briefcase, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  Sparkles,
  GitCompare,
  Trash2
} from 'lucide-react';
import { resumesApi, jobsApi, analysisApi, ResumeData, JobDescriptionData } from '../services/api';

export const ResumeJobPage: React.FC = () => {
  const navigate = useNavigate();

  // Resume states
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [resumeTab, setResumeTab] = useState<'upload' | 'paste'>('upload');
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);

  // Job Description states
  const [jobTitle, setJobTitle] = useState('Senior Backend Engineer');
  const [jobCompany, setJobCompany] = useState('Stripe');
  const [jobText, setJobText] = useState('');
  const [jobUploading, setJobUploading] = useState(false);
  const [jobData, setJobData] = useState<JobDescriptionData | null>(null);
  const [jobError, setJobError] = useState<string | null>(null);

  // Analyzing state
  const [analyzingGap, setAnalyzingGap] = useState(false);

  useEffect(() => {
    const fetchExisting = async () => {
      try {
        const [rRes, jRes] = await Promise.allSettled([
          resumesApi.getLatest(),
          jobsApi.getLatest(),
        ]);
        if (rRes.status === 'fulfilled' && rRes.value.data) setResumeData(rRes.value.data);
        if (jRes.status === 'fulfilled' && jRes.value.data) setJobData(jRes.value.data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchExisting();
  }, []);

  const handleResumeUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setResumeError(null);
    setResumeUploading(true);

    try {
      let res;
      if (resumeTab === 'upload') {
        if (!resumeFile) {
          throw new Error('Please select a PDF or DOCX file to upload.');
        }
        res = await resumesApi.uploadFile(resumeFile);
      } else {
        if (!resumeText.trim()) {
          throw new Error('Please paste your resume text.');
        }
        res = await resumesApi.uploadText(resumeText);
      }
      setResumeData(res.data);
    } catch (err: any) {
      setResumeError(err.response?.data?.detail || err.message || 'Failed to parse resume.');
    } finally {
      setResumeUploading(false);
    }
  };

  const handleJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setJobError(null);
    setJobUploading(true);

    try {
      if (!jobText.trim()) {
        throw new Error('Please enter or paste the target job description.');
      }
      const res = await jobsApi.create({
        title: jobTitle,
        company: jobCompany,
        raw_text: jobText,
      });
      setJobData(res.data);
    } catch (err: any) {
      setJobError(err.response?.data?.detail || err.message || 'Failed to analyze job description.');
    } finally {
      setJobUploading(false);
    }
  };

  const handleRunAnalysis = async () => {
    if (!resumeData) {
      setResumeError('Please upload your resume first.');
      return;
    }
    if (!jobData) {
      setJobError('Please add a target job description first.');
      return;
    }

    setAnalyzingGap(true);
    try {
      await analysisApi.analyzeSkillGap({
        resume_id: resumeData.id,
        job_id: jobData.id,
      });
      navigate('/skill-gap');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to run skill gap analysis.');
    } finally {
      setAnalyzingGap(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Page Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Profile & Target Job
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Provide your candidate background and the exact job description you're preparing for.
            </p>
          </div>

          <div>
            <button
              onClick={handleRunAnalysis}
              disabled={analyzingGap || !resumeData || !jobData}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {analyzingGap ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing Skill Gap...
                </>
              ) : (
                <>
                  <GitCompare className="w-4 h-4" />
                  Run Skill Gap Analysis
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dual Grid: Resume vs Job Description */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 1. Resume Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Your Resume</h2>
                  <p className="text-xs text-slate-500">PDF, DOCX, or plain text</p>
                </div>
              </div>
              {resumeData && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Parsed & Ready
                </span>
              )}
            </div>

            {resumeError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{resumeError}</span>
              </div>
            )}

            {/* Toggle Upload vs Paste */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setResumeTab('upload')}
                className={`flex-1 py-1.5 rounded-md transition ${
                  resumeTab === 'upload' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Upload File (PDF / DOCX)
              </button>
              <button
                type="button"
                onClick={() => setResumeTab('paste')}
                className={`flex-1 py-1.5 rounded-md transition ${
                  resumeTab === 'paste' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Paste Text
              </button>
            </div>

            <form onSubmit={handleResumeUpload} className="space-y-4">
              {resumeTab === 'upload' ? (
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-indigo-400 transition bg-slate-50/50">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <label className="cursor-pointer">
                    <span className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                      Choose PDF or DOCX file
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={(e) => setResumeFile(e.target.files ? e.target.files[0] : null)}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {resumeFile ? resumeFile.name : 'Max file size 10MB'}
                  </p>
                </div>
              ) : (
                <div>
                  <textarea
                    rows={6}
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder="Paste the full text of your resume here..."
                    className="w-full p-3.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  ></textarea>
                </div>
              )}

              <button
                type="submit"
                disabled={resumeUploading}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {resumeUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Extracting & Parsing Profile...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Parse Resume Profile
                  </>
                )}
              </button>
            </form>

            {/* Structured Profile Preview if parsed */}
            {resumeData?.profile && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 uppercase tracking-wider">
                  <span>Detected Candidate Skills ({resumeData.profile.skills.length})</span>
                  <span className="text-indigo-600">{resumeData.profile.years_of_experience} yrs exp</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {resumeData.profile.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-800 text-xs font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                {resumeData.profile.experience && resumeData.profile.experience.length > 0 && (
                  <div className="pt-2 text-xs text-slate-600 border-t border-slate-200">
                    <span className="font-semibold text-slate-800">Latest Role: </span>
                    {resumeData.profile.experience[0].title} at {resumeData.profile.experience[0].company}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Job Description Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Target Job Posting</h2>
                  <p className="text-xs text-slate-500">Role specifications and requirements</p>
                </div>
              </div>
              {jobData && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Requirements Mapped
                </span>
              )}
            </div>

            {jobError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{jobError}</span>
              </div>
            )}

            <form onSubmit={handleJobSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role Title</label>
                  <input
                    type="text"
                    required
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="Staff Software Engineer"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company</label>
                  <input
                    type="text"
                    value={jobCompany}
                    onChange={(e) => setJobCompany(e.target.value)}
                    placeholder="Company name"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Job Description / Requirements Text
                </label>
                <textarea
                  rows={6}
                  required
                  value={jobText}
                  onChange={(e) => setJobText(e.target.value)}
                  placeholder="Paste the full job posting, required qualifications, and responsibilities here..."
                  className="w-full p-3.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={jobUploading}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {jobUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Extracting Requirements...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Extract Job Requirements
                  </>
                )}
              </button>
            </form>

            {/* Structured Job Requirements Preview */}
            {jobData && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 uppercase tracking-wider">
                  <span>Mapped Required Skills ({jobData.required_skills?.length || 0})</span>
                  <span className="text-blue-600">{jobData.seniority || 'Mid-Level'}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(jobData.required_skills || []).map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md bg-white border border-blue-200 text-blue-900 text-xs font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                {jobData.experience_requirements && (
                  <div className="pt-2 text-xs text-slate-600 border-t border-slate-200">
                    <span className="font-semibold text-slate-800">Experience requirement: </span>
                    {jobData.experience_requirements}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};
