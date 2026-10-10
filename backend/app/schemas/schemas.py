from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field

# ----------------- AUTH SCHEMAS -----------------
class UserRegisterRequest(BaseModel):
    email: str
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = None
    target_role: Optional[str] = None
    experience_level: Optional[str] = None

class UserLoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    target_role: Optional[str] = None
    experience_level: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ----------------- RESUME / CANDIDATE PROFILE SCHEMAS -----------------
class CandidateExperience(BaseModel):
    title: str
    company: str
    duration: Optional[str] = None
    description: Optional[str] = None
    technologies: List[str] = []

class CandidateEducation(BaseModel):
    degree: str
    institution: str
    year: Optional[str] = None

class CandidateProject(BaseModel):
    name: str
    description: str
    technologies: List[str] = []
    link: Optional[str] = None

class CandidateProfileSchema(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    summary: Optional[str] = None
    skills: List[str] = []
    experience: List[CandidateExperience] = []
    education: List[CandidateEducation] = []
    projects: List[CandidateProject] = []
    certifications: List[str] = []
    achievements: List[str] = []
    years_of_experience: float = 0.0

class ResumeResponse(BaseModel):
    id: str
    filename: str
    file_type: str
    created_at: datetime
    profile: Optional[CandidateProfileSchema] = None

    class Config:
        from_attributes = True


# ----------------- JOB DESCRIPTION SCHEMAS -----------------
class JobDescriptionCreate(BaseModel):
    title: str
    company: Optional[str] = None
    raw_text: str

class JobRequirementsSchema(BaseModel):
    role_type: Optional[str] = None
    domain: Optional[str] = None
    seniority: Optional[str] = None
    required_skills: List[str] = []
    preferred_skills: List[str] = []
    technologies: List[str] = []
    responsibilities: List[str] = []
    experience_requirements: Optional[str] = None

class JobDescriptionResponse(BaseModel):
    id: str
    title: str
    company: Optional[str] = None
    role_type: Optional[str] = None
    domain: Optional[str] = None
    seniority: Optional[str] = None
    required_skills: List[str] = []
    preferred_skills: List[str] = []
    technologies: List[str] = []
    responsibilities: List[str] = []
    experience_requirements: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ----------------- SKILL GAP SCHEMAS -----------------
class MissingSkillDetail(BaseModel):
    skill: str
    importance: str = "High"  # High, Medium, Low
    reason: str
    recommended_topics: List[str] = []

class SkillGapAnalyzeRequest(BaseModel):
    resume_id: Optional[str] = None
    job_id: Optional[str] = None

class SkillGapResponse(BaseModel):
    id: str
    match_score: float
    strong_matches: List[str] = []
    partial_matches: List[str] = []
    missing_skills: List[MissingSkillDetail] = []
    recommended_priorities: List[str] = []
    created_at: datetime

    class Config:
        from_attributes = True


# ----------------- PREPARATION PLAN SCHEMAS -----------------
class PlanTopicSchema(BaseModel):
    id: str
    week_number: int
    order_index: int
    title: str
    category: Optional[str] = None
    description: Optional[str] = None
    key_concepts: List[str] = []
    recommended_resources: List[str] = []
    is_completed: bool = False
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PreparationPlanResponse(BaseModel):
    id: str
    target_role: str
    duration_weeks: int
    overview: Optional[str] = None
    total_topics: int
    completed_topics: int
    progress_percentage: float
    topics: List[PlanTopicSchema] = []
    created_at: datetime

    class Config:
        from_attributes = True

class PlanGenerateRequest(BaseModel):
    target_role: Optional[str] = None
    duration_weeks: int = 4
    focus_areas: List[str] = []


# ----------------- RAG DOCUMENT SCHEMAS -----------------
class DocumentChunkResult(BaseModel):
    chunk_index: int
    content: str
    similarity_score: float
    document_filename: str

class DocumentQueryRequest(BaseModel):
    query: str
    limit: int = 4

class DocumentQueryResponse(BaseModel):
    query: str
    results: List[DocumentChunkResult]

class DocumentResponse(BaseModel):
    id: str
    filename: str
    topic: Optional[str] = None
    file_type: Optional[str] = None
    char_count: int
    created_at: datetime

    class Config:
        from_attributes = True


# ----------------- INTERVIEW SCHEMAS -----------------
class InterviewStartRequest(BaseModel):
    target_role: Optional[str] = None
    interview_type: str = "Technical"  # Technical, Behavioral, System Design, Mixed
    difficulty: str = "Mid"            # Junior, Mid, Senior, Lead
    total_questions: int = 5
    focus_areas: List[str] = []

class AnswerEvaluationDetail(BaseModel):
    overall_score: float
    technical_accuracy: float
    relevance: float
    communication: float
    depth: float
    strengths: List[str] = []
    improvements: List[str] = []
    missing_points: List[str] = []
    model_answer_highlights: Optional[str] = None

class InterviewQuestionDetail(BaseModel):
    id: str
    order_index: int
    question_text: str
    category: Optional[str] = None
    difficulty: Optional[str] = None
    is_answered: bool = False
    answer_text: Optional[str] = None
    evaluation: Optional[AnswerEvaluationDetail] = None

class InterviewSessionResponse(BaseModel):
    id: str
    target_role: str
    interview_type: str
    difficulty: str
    total_questions: int
    current_question_index: int
    is_completed: bool
    questions: List[InterviewQuestionDetail] = []
    overall_score: Optional[float] = None
    technical_accuracy_score: Optional[float] = None
    communication_score: Optional[float] = None
    relevance_score: Optional[float] = None
    depth_score: Optional[float] = None
    strengths: List[str] = []
    weak_areas: List[str] = []
    recommended_topics: List[str] = []
    feedback_summary: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class InterviewAnswerSubmitRequest(BaseModel):
    transcript: str
    duration_seconds: int = 0


# ----------------- PROGRESS SCHEMAS -----------------
class ProgressSummaryResponse(BaseModel):
    has_profile: bool
    has_job_target: bool
    skill_gap_analyzed: bool
    match_score: Optional[float] = None
    plan_exists: bool
    topics_completed: int
    total_topics: int
    plan_progress_percent: float
    interviews_completed: int
    average_interview_score: Optional[float] = None
    recent_interview_score: Optional[float] = None
    score_history: List[Dict[str, Any]] = []
    strong_skills: List[str] = []
    weak_topics: List[str] = []
    recent_interviews: List[Dict[str, Any]] = []


# ----------------- CONFIG STATUS SCHEMAS -----------------
class ConfigStatusResponse(BaseModel):
    database_status: str
    database_type: str
    llm_provider: str
    llm_configured: bool
    available_providers: List[str]
    model_name: str
    embedding_provider: str
    rag_ready: bool
