from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import User, CandidateProfile, JobDescription, SkillGap, PreparationPlan, PreparationTopic
from app.schemas.schemas import PlanGenerateRequest, PreparationPlanResponse, PlanTopicSchema
from app.api.deps import get_current_user
from app.services.plan_generator import plan_generator

router = APIRouter(prefix="/preparation-plans", tags=["Preparation Plans"])

@router.post("/generate", response_model=PreparationPlanResponse)
async def generate_plan(
    payload: Optional[PlanGenerateRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Fetch profile, job, and skill gap
    profile = (
        db.query(CandidateProfile)
        .filter(CandidateProfile.user_id == current_user.id)
        .order_by(CandidateProfile.created_at.desc())
        .first()
    )
    job = (
        db.query(JobDescription)
        .filter(JobDescription.user_id == current_user.id)
        .order_by(JobDescription.created_at.desc())
        .first()
    )
    gap = (
        db.query(SkillGap)
        .filter(SkillGap.user_id == current_user.id)
        .order_by(SkillGap.created_at.desc())
        .first()
    )

    target_role = (
        (payload.target_role if payload and payload.target_role else None)
        or (job.role_type if job and job.role_type else None)
        or (job.title if job else None)
        or current_user.target_role
        or "Software Engineer"
    )

    duration = payload.duration_weeks if payload else 4
    strong_skills = (profile.skills or []) if profile else ["Python", "Problem Solving"]
    missing_skills = (gap.missing_skills or []) if gap else [
        {"skill": "System Design", "importance": "High"},
        {"skill": "Distributed Caching", "importance": "Medium"}
    ]
    focus_areas = payload.focus_areas if payload else []

    plan_result = await plan_generator.generate_plan(
        target_role=target_role,
        duration_weeks=duration,
        strong_skills=strong_skills,
        missing_skills=missing_skills,
        focus_areas=focus_areas
    )

    # Archive or remove previous plan
    old_plans = db.query(PreparationPlan).filter(PreparationPlan.user_id == current_user.id).all()
    for p in old_plans:
        db.delete(p)
    db.flush()

    new_plan = PreparationPlan(
        user_id=current_user.id,
        target_role=target_role,
        duration_weeks=duration,
        overview=plan_result.get("overview"),
        total_topics=len(plan_result.get("topics", [])),
        completed_topics=0,
        progress_percentage=0.0
    )
    db.add(new_plan)
    db.flush()

    topics = []
    for t_data in plan_result.get("topics", []):
        topic_rec = PreparationTopic(
            plan_id=new_plan.id,
            week_number=t_data["week_number"],
            order_index=t_data["order_index"],
            title=t_data["title"],
            category=t_data.get("category"),
            description=t_data.get("description"),
            key_concepts=t_data.get("key_concepts", []),
            recommended_resources=t_data.get("recommended_resources", []),
            is_completed=False
        )
        db.add(topic_rec)
        topics.append(topic_rec)

    db.commit()
    db.refresh(new_plan)

    return PreparationPlanResponse(
        id=new_plan.id,
        target_role=new_plan.target_role,
        duration_weeks=new_plan.duration_weeks,
        overview=new_plan.overview,
        total_topics=new_plan.total_topics,
        completed_topics=new_plan.completed_topics,
        progress_percentage=new_plan.progress_percentage,
        topics=[
            PlanTopicSchema(
                id=t.id,
                week_number=t.week_number,
                order_index=t.order_index,
                title=t.title,
                category=t.category,
                description=t.description,
                key_concepts=t.key_concepts or [],
                recommended_resources=t.recommended_resources or [],
                is_completed=t.is_completed,
                completed_at=t.completed_at
            ) for t in new_plan.topics
        ],
        created_at=new_plan.created_at
    )

@router.get("/current", response_model=Optional[PreparationPlanResponse])
def get_current_plan(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plan = (
        db.query(PreparationPlan)
        .filter(PreparationPlan.user_id == current_user.id)
        .order_by(PreparationPlan.created_at.desc())
        .first()
    )
    if not plan:
        return None

    return PreparationPlanResponse(
        id=plan.id,
        target_role=plan.target_role,
        duration_weeks=plan.duration_weeks,
        overview=plan.overview,
        total_topics=plan.total_topics,
        completed_topics=plan.completed_topics,
        progress_percentage=plan.progress_percentage,
        topics=[
            PlanTopicSchema(
                id=t.id,
                week_number=t.week_number,
                order_index=t.order_index,
                title=t.title,
                category=t.category,
                description=t.description,
                key_concepts=t.key_concepts or [],
                recommended_resources=t.recommended_resources or [],
                is_completed=t.is_completed,
                completed_at=t.completed_at
            ) for t in plan.topics
        ],
        created_at=plan.created_at
    )

@router.post("/topics/{topic_id}/toggle")
def toggle_topic_complete(
    topic_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    topic = db.query(PreparationTopic).filter(PreparationTopic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Preparation topic not found.")

    plan = db.query(PreparationPlan).filter(PreparationPlan.id == topic.plan_id, PreparationPlan.user_id == current_user.id).first()
    if not plan:
        raise HTTPException(status_code=403, detail="Unauthorized access to this topic.")

    topic.is_completed = not topic.is_completed
    topic.completed_at = datetime.utcnow() if topic.is_completed else None
    
    # Recalculate plan stats
    completed = sum(1 for t in plan.topics if t.is_completed)
    total = len(plan.topics)
    plan.completed_topics = completed
    plan.progress_percentage = round((completed / total) * 100.0, 1) if total > 0 else 0.0
    
    db.commit()
    return {
        "topic_id": topic.id,
        "is_completed": topic.is_completed,
        "completed_topics": plan.completed_topics,
        "total_topics": plan.total_topics,
        "progress_percentage": plan.progress_percentage
    }
