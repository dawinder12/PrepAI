import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Inject Bearer token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('prepai_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 unauth
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register' && window.location.pathname !== '/') {
        localStorage.removeItem('prepai_token');
        localStorage.removeItem('prepai_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: string;
  email: string;
  full_name?: string;
  target_role?: string;
  experience_level?: string;
}

export interface CandidateProfile {
  full_name?: string;
  email?: string;
  phone?: string;
  summary?: string;
  skills: string[];
  experience: any[];
  education: any[];
  projects: any[];
  certifications: string[];
  achievements: string[];
  years_of_experience: number;
}

export interface ResumeData {
  id: string;
  filename: string;
  file_type: string;
  created_at: string;
  profile?: CandidateProfile;
}

export interface JobDescriptionData {
  id: string;
  title: string;
  company?: string;
  role_type?: string;
  domain?: string;
  seniority?: string;
  required_skills: string[];
  preferred_skills: string[];
  technologies: string[];
  responsibilities: string[];
  experience_requirements?: string;
  created_at: string;
}

export interface MissingSkill {
  skill: string;
  importance: string;
  reason: string;
  recommended_topics: string[];
}

export interface SkillGapData {
  id: string;
  match_score: number;
  strong_matches: string[];
  partial_matches: string[];
  missing_skills: MissingSkill[];
  recommended_priorities: string[];
  created_at: string;
}

export interface PlanTopic {
  id: string;
  week_number: number;
  order_index: number;
  title: string;
  category?: string;
  description?: string;
  key_concepts: string[];
  recommended_resources: string[];
  is_completed: boolean;
  completed_at?: string;
}

export interface PreparationPlanData {
  id: string;
  target_role: string;
  duration_weeks: number;
  overview?: string;
  total_topics: number;
  completed_topics: number;
  progress_percentage: number;
  topics: PlanTopic[];
  created_at: string;
}

export interface AnswerEvaluation {
  overall_score: number;
  technical_accuracy: number;
  relevance: number;
  communication: number;
  depth: number;
  strengths: string[];
  improvements: string[];
  missing_points: string[];
  model_answer_highlights?: string;
}

export interface InterviewQuestionItem {
  id: string;
  order_index: number;
  question_text: string;
  category?: string;
  difficulty?: string;
  is_answered: boolean;
  evaluation?: AnswerEvaluation;
}

export interface InterviewSessionData {
  id: string;
  target_role: string;
  interview_type: string;
  difficulty: string;
  total_questions: number;
  current_question_index: number;
  is_completed: boolean;
  questions: InterviewQuestionItem[];
  overall_score?: number;
  technical_accuracy_score?: number;
  communication_score?: number;
  relevance_score?: number;
  depth_score?: number;
  strengths: string[];
  weak_areas: string[];
  recommended_topics: string[];
  feedback_summary?: string;
  created_at: string;
  completed_at?: string;
}

export interface ProgressSummaryData {
  has_profile: boolean;
  has_job_target: boolean;
  skill_gap_analyzed: boolean;
  match_score?: number;
  plan_exists: boolean;
  topics_completed: number;
  total_topics: number;
  plan_progress_percent: number;
  interviews_completed: number;
  average_interview_score?: number;
  recent_interview_score?: number;
  score_history: Array<{ date: string; score: number; role: string; type: string }>;
  strong_skills: string[];
  weak_topics: string[];
  recent_interviews: Array<any>;
}

export interface ConfigStatusData {
  database_status: string;
  database_type: string;
  llm_provider: string;
  llm_configured: boolean;
  available_providers: string[];
  model_name: string;
  embedding_provider: string;
  rag_ready: boolean;
}

// API methods
export const authApi = {
  register: (data: any) => api.post<{ access_token: string; user: User }>('/auth/register', data),
  login: (data: any) => api.post<{ access_token: string; user: User }>('/auth/login', data),
  getMe: () => api.get<User>('/auth/me'),
};

export const resumesApi = {
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ResumeData>('/resumes/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadText: (raw_text: string) => {
    const formData = new FormData();
    formData.append('raw_text', raw_text);
    return api.post<ResumeData>('/resumes/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getLatest: () => api.get<ResumeData | null>('/resumes/latest'),
};

export const jobsApi = {
  create: (data: { title: string; company?: string; raw_text: string }) =>
    api.post<JobDescriptionData>('/job-descriptions/', data),
  getLatest: () => api.get<JobDescriptionData | null>('/job-descriptions/latest'),
  getAll: () => api.get<JobDescriptionData[]>('/job-descriptions/'),
};

export const analysisApi = {
  analyzeSkillGap: (data?: { resume_id?: string; job_id?: string }) =>
    api.post<SkillGapData>('/analyze/skill-gap', data || {}),
  getLatestSkillGap: () => api.get<SkillGapData | null>('/analyze/skill-gap/latest'),
};

export const plansApi = {
  generate: (data?: { target_role?: string; duration_weeks?: number; focus_areas?: string[] }) =>
    api.post<PreparationPlanData>('/preparation-plans/generate', data || {}),
  getCurrent: () => api.get<PreparationPlanData | null>('/preparation-plans/current'),
  toggleTopic: (topicId: string) => api.post(`/preparation-plans/topics/${topicId}/toggle`),
};

export const ragApi = {
  uploadDocument: (file: File, topic?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (topic) formData.append('topic', topic);
    return api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getDocuments: () => api.get<any[]>('/documents/'),
  queryKnowledge: (query: string, limit = 4) =>
    api.post<{ query: string; results: any[] }>('/documents/query', { query, limit }),
};

export const interviewsApi = {
  start: (data: { target_role?: string; interview_type: string; difficulty: string; total_questions: number; focus_areas?: string[] }) =>
    api.post<InterviewSessionData>('/interviews/start', data),
  getSession: (id: string) => api.get<InterviewSessionData>(`/interviews/${id}`),
  submitAnswer: (id: string, transcript: string, duration_seconds = 0) =>
    api.post<InterviewSessionData>(`/interviews/${id}/answer`, { transcript, duration_seconds }),
  transcribeAudio: (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append('file', audioBlob, 'answer_recording.webm');
    return api.post<{ success: boolean; transcript: string; message?: string }>('/interviews/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  completeSession: (id: string) => api.post<InterviewSessionData>(`/interviews/${id}/complete`),
  getAll: () => api.get<InterviewSessionData[]>('/interviews/'),
};

export const progressApi = {
  getProgress: () => api.get<ProgressSummaryData>('/progress/'),
};

export const configApi = {
  getStatus: () => api.get<ConfigStatusData>('/config/status'),
};

export default api;
