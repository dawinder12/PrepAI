import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Text, Integer, Float, Boolean, DateTime, ForeignKey, JSON, Index
)
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    target_role = Column(String(255), nullable=True)
    experience_level = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    job_descriptions = relationship("JobDescription", back_populates="user", cascade="all, delete-orphan")
    candidate_profiles = relationship("CandidateProfile", back_populates="user", cascade="all, delete-orphan")
    skill_gaps = relationship("SkillGap", back_populates="user", cascade="all, delete-orphan")
    preparation_plans = relationship("PreparationPlan", back_populates="user", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")
    interview_sessions = relationship("InterviewSession", back_populates="user", cascade="all, delete-orphan")
    progress_records = relationship("ProgressRecord", back_populates="user", cascade="all, delete-orphan")


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)
    raw_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="resumes")
    profile = relationship("CandidateProfile", back_populates="resume", uselist=False, cascade="all, delete-orphan")


class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    resume_id = Column(String(36), ForeignKey("resumes.id", ondelete="CASCADE"), nullable=True)
    
    full_name = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(100), nullable=True)
    summary = Column(Text, nullable=True)
    
    # Structured representations stored as JSON
    skills = Column(JSON, default=list)            # List of skill strings
    experience = Column(JSON, default=list)        # List of job experience objects
    education = Column(JSON, default=list)         # List of education objects
    projects = Column(JSON, default=list)          # List of project objects
    certifications = Column(JSON, default=list)    # List of certification strings
    achievements = Column(JSON, default=list)      # List of achievement strings
    years_of_experience = Column(Float, default=0.0)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="candidate_profiles")
    resume = relationship("Resume", back_populates="profile")


class JobDescription(Base):
    __tablename__ = "job_descriptions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    company = Column(String(255), nullable=True)
    raw_text = Column(Text, nullable=False)
    
    # Structured requirements extracted
    role_type = Column(String(100), nullable=True)
    domain = Column(String(100), nullable=True)
    seniority = Column(String(100), nullable=True)
    required_skills = Column(JSON, default=list)
    preferred_skills = Column(JSON, default=list)
    technologies = Column(JSON, default=list)
    responsibilities = Column(JSON, default=list)
    experience_requirements = Column(String(255), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="job_descriptions")


class SkillGap(Base):
    __tablename__ = "skill_gaps"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    resume_id = Column(String(36), ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True)
    job_id = Column(String(36), ForeignKey("job_descriptions.id", ondelete="SET NULL"), nullable=True)
    
    match_score = Column(Float, default=0.0)       # 0.0 to 100.0%
    strong_matches = Column(JSON, default=list)    # List of skills candidate has that match JD
    partial_matches = Column(JSON, default=list)   # List of related skills candidate has
    missing_skills = Column(JSON, default=list)    # List of {skill, importance, reason, recommended_topics}
    recommended_priorities = Column(JSON, default=list) # Priority ordered actions
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="skill_gaps")


class PreparationPlan(Base):
    __tablename__ = "preparation_plans"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    target_role = Column(String(255), nullable=False)
    duration_weeks = Column(Integer, default=4)
    overview = Column(Text, nullable=True)
    
    total_topics = Column(Integer, default=0)
    completed_topics = Column(Integer, default=0)
    progress_percentage = Column(Float, default=0.0)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="preparation_plans")
    topics = relationship("PreparationTopic", back_populates="plan", cascade="all, delete-orphan", order_by="PreparationTopic.order_index")


class PreparationTopic(Base):
    __tablename__ = "preparation_topics"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    plan_id = Column(String(36), ForeignKey("preparation_plans.id", ondelete="CASCADE"), nullable=False, index=True)
    week_number = Column(Integer, nullable=False)
    order_index = Column(Integer, default=0)
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=True)  # e.g., Fundamentals, System Design, Coding, Behavioral
    description = Column(Text, nullable=True)
    key_concepts = Column(JSON, default=list)
    recommended_resources = Column(JSON, default=list)
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)

    plan = relationship("PreparationPlan", back_populates="topics")


class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    topic = Column(String(255), nullable=True)
    file_type = Column(String(50), nullable=True)
    char_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="documents")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    embedding = Column(JSON, nullable=True)       # Vector stored as list of floats
    token_count = Column(Integer, default=0)
    
    document = relationship("Document", back_populates="chunks")


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    target_role = Column(String(255), nullable=False)
    interview_type = Column(String(100), default="Technical") # Technical, Behavioral, System Design, Mixed
    difficulty = Column(String(50), default="Mid")            # Junior, Mid, Senior, Lead
    total_questions = Column(Integer, default=5)
    current_question_index = Column(Integer, default=0)
    is_completed = Column(Boolean, default=False)
    
    # Overall summary metrics
    overall_score = Column(Float, nullable=True)
    technical_accuracy_score = Column(Float, nullable=True)
    communication_score = Column(Float, nullable=True)
    relevance_score = Column(Float, nullable=True)
    depth_score = Column(Float, nullable=True)
    
    strengths = Column(JSON, default=list)
    weak_areas = Column(JSON, default=list)
    recommended_topics = Column(JSON, default=list)
    feedback_summary = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="interview_sessions")
    questions = relationship("InterviewQuestion", back_populates="session", cascade="all, delete-orphan", order_by="InterviewQuestion.order_index")


class InterviewQuestion(Base):
    __tablename__ = "interview_questions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("interview_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    order_index = Column(Integer, nullable=False)
    question_text = Column(Text, nullable=False)
    category = Column(String(100), nullable=True)
    expected_key_points = Column(JSON, default=list)
    difficulty = Column(String(50), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    session = relationship("InterviewSession", back_populates="questions")
    answer = relationship("InterviewAnswer", back_populates="question", uselist=False, cascade="all, delete-orphan")


class InterviewAnswer(Base):
    __tablename__ = "interview_answers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    question_id = Column(String(36), ForeignKey("interview_questions.id", ondelete="CASCADE"), nullable=False, index=True)
    transcript = Column(Text, nullable=False)
    duration_seconds = Column(Integer, default=0)
    audio_url = Column(String(500), nullable=True)
    answered_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    question = relationship("InterviewQuestion", back_populates="answer")
    evaluation = relationship("AnswerEvaluation", back_populates="answer", uselist=False, cascade="all, delete-orphan")


class AnswerEvaluation(Base):
    __tablename__ = "answer_evaluations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    answer_id = Column(String(36), ForeignKey("interview_answers.id", ondelete="CASCADE"), nullable=False, index=True)
    
    overall_score = Column(Float, nullable=False)          # 1 - 10
    technical_accuracy = Column(Float, nullable=False)     # 1 - 10
    relevance = Column(Float, nullable=False)              # 1 - 10
    communication = Column(Float, nullable=False)          # 1 - 10
    depth = Column(Float, nullable=False)                  # 1 - 10
    
    strengths = Column(JSON, default=list)
    improvements = Column(JSON, default=list)
    missing_points = Column(JSON, default=list)
    model_answer_highlights = Column(Text, nullable=True)
    
    evaluated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    answer = relationship("InterviewAnswer", back_populates="evaluation")


class ProgressRecord(Base):
    __tablename__ = "progress_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    metric_type = Column(String(100), nullable=False)      # e.g., "interview_score", "skill_mastery", "topics_completed"
    value = Column(Float, nullable=False)
    metadata_info = Column(JSON, default=dict)
    recorded_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="progress_records")
