from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import User, JobDescription
from app.schemas.schemas import JobDescriptionCreate, JobDescriptionResponse
from app.api.deps import get_current_user
from app.services.job_analyzer import job_analyzer

router = APIRouter(prefix="/job-descriptions", tags=["Job Descriptions"])

@router.post("/", response_model=JobDescriptionResponse)
async def create_job_description(
    payload: JobDescriptionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not payload.raw_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job description text cannot be empty."
        )

    # Analyze structured requirements
    analysis = await job_analyzer.analyze_job(payload.raw_text, title=payload.title)

    job_rec = JobDescription(
        user_id=current_user.id,
        title=payload.title,
        company=payload.company or "Target Company",
        raw_text=payload.raw_text,
        role_type=analysis.get("role_type"),
        domain=analysis.get("domain"),
        seniority=analysis.get("seniority"),
        required_skills=analysis.get("required_skills", []),
        preferred_skills=analysis.get("preferred_skills", []),
        technologies=analysis.get("technologies", []),
        responsibilities=analysis.get("responsibilities", []),
        experience_requirements=analysis.get("experience_requirements")
    )
    db.add(job_rec)
    db.commit()
    db.refresh(job_rec)

    return JobDescriptionResponse(
        id=job_rec.id,
        title=job_rec.title,
        company=job_rec.company,
        role_type=job_rec.role_type,
        domain=job_rec.domain,
        seniority=job_rec.seniority,
        required_skills=job_rec.required_skills or [],
        preferred_skills=job_rec.preferred_skills or [],
        technologies=job_rec.technologies or [],
        responsibilities=job_rec.responsibilities or [],
        experience_requirements=job_rec.experience_requirements,
        created_at=job_rec.created_at
    )

@router.get("/latest", response_model=Optional[JobDescriptionResponse])
def get_latest_job(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    job = (
        db.query(JobDescription)
        .filter(JobDescription.user_id == current_user.id)
        .order_by(JobDescription.created_at.desc())
        .first()
    )
    if not job:
        return None
    return job

@router.get("/", response_model=List[JobDescriptionResponse])
def get_all_jobs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return (
        db.query(JobDescription)
        .filter(JobDescription.user_id == current_user.id)
        .order_by(JobDescription.created_at.desc())
        .all()
    )
