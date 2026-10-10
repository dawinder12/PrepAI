from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import (
    User, CandidateProfile, JobDescription, SkillGap,
    PreparationPlan, InterviewSession, ProgressRecord
)
from app.schemas.schemas import ProgressSummaryResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/progress", tags=["Progress Tracking"])

@router.get("/", response_model=ProgressSummaryResponse)
def get_user_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    job = db.query(JobDescription).filter(JobDescription.user_id == current_user.id).first()
    gap = db.query(SkillGap).filter(SkillGap.user_id == current_user.id).order_by(SkillGap.created_at.desc()).first()
    plan = db.query(PreparationPlan).filter(PreparationPlan.user_id == current_user.id).order_by(PreparationPlan.created_at.desc()).first()
    
    interviews = (
        db.query(InterviewSession)
        .filter(InterviewSession.user_id == current_user.id, InterviewSession.is_completed == True)
        .order_by(InterviewSession.completed_at.desc())
        .all()
    )

    interviews_count = len(interviews)
    avg_score = (
        round(sum(i.overall_score for i in interviews if i.overall_score is not None) / interviews_count, 1)
        if interviews_count > 0 else None
    )
    recent_score = interviews[0].overall_score if interviews_count > 0 else None

    score_history = []
    # Reverse so oldest to newest for chronological progress trend
    for i in reversed(interviews):
        if i.overall_score is not None:
            score_history.append({
                "date": i.completed_at.strftime("%b %d") if i.completed_at else "Recent",
                "score": i.overall_score,
                "role": i.target_role,
                "type": i.interview_type
            })

    # Collect strong and weak topics from genuine session evaluations
    weak_topics_set = set()
    strong_topics_set = set()
    for i in interviews:
        for w in (i.weak_areas or []):
            weak_topics_set.add(w)
        for s in (i.strengths or []):
            strong_topics_set.add(s)

    recent_sessions_list = []
    for i in interviews[:5]:
        recent_sessions_list.append({
            "id": i.id,
            "target_role": i.target_role,
            "interview_type": i.interview_type,
            "difficulty": i.difficulty,
            "overall_score": i.overall_score,
            "completed_at": i.completed_at.isoformat() if i.completed_at else None
        })

    return ProgressSummaryResponse(
        has_profile=profile is not None,
        has_job_target=job is not None,
        skill_gap_analyzed=gap is not None,
        match_score=gap.match_score if gap else None,
        plan_exists=plan is not None,
        topics_completed=plan.completed_topics if plan else 0,
        total_topics=plan.total_topics if plan else 0,
        plan_progress_percent=plan.progress_percentage if plan else 0.0,
        interviews_completed=interviews_count,
        average_interview_score=avg_score,
        recent_interview_score=recent_score,
        score_history=score_history,
        strong_skills=list(strong_topics_set)[:6] if strong_topics_set else (profile.skills[:5] if profile and profile.skills else []),
        weak_topics=list(weak_topics_set)[:6] if weak_topics_set else ([m.get("skill") for m in gap.missing_skills[:3]] if gap and gap.missing_skills else []),
        recent_interviews=recent_sessions_list
    )
