from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import User, Resume, CandidateProfile, JobDescription, SkillGap
from app.schemas.schemas import SkillGapAnalyzeRequest, SkillGapResponse
from app.api.deps import get_current_user
from app.services.skill_gap_analyzer import skill_gap_analyzer

router = APIRouter(prefix="/analyze", tags=["Skill Gap Analysis"])

@router.post("/skill-gap", response_model=SkillGapResponse)
async def analyze_skill_gap(
    payload: Optional[SkillGapAnalyzeRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume_id = payload.resume_id if payload else None
    job_id = payload.job_id if payload else None

    # Retrieve profile
    if resume_id:
        profile = db.query(CandidateProfile).filter(CandidateProfile.resume_id == resume_id).first()
    else:
        profile = (
            db.query(CandidateProfile)
            .filter(CandidateProfile.user_id == current_user.id)
            .order_by(CandidateProfile.created_at.desc())
            .first()
        )

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No candidate profile found. Please upload your resume first."
        )

    # Retrieve job description
    if job_id:
        job = db.query(JobDescription).filter(JobDescription.id == job_id, JobDescription.user_id == current_user.id).first()
    else:
        job = (
            db.query(JobDescription)
            .filter(JobDescription.user_id == current_user.id)
            .order_by(JobDescription.created_at.desc())
            .first()
        )

    if not job:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No target job description found. Please paste or upload a job description first."
        )

    candidate_skills = profile.skills or []
    cand_profile_dict = {
        "summary": profile.summary,
        "experience": profile.experience,
        "education": profile.education,
        "projects": profile.projects
    }
    job_req_dict = {
        "role_type": job.role_type or job.title,
        "required_skills": job.required_skills or [],
        "preferred_skills": job.preferred_skills or [],
        "technologies": job.technologies or []
    }

    gap_result = await skill_gap_analyzer.analyze(
        candidate_skills=candidate_skills,
        candidate_profile=cand_profile_dict,
        job_requirements=job_req_dict
    )

    # Persist in DB
    skill_gap_rec = SkillGap(
        user_id=current_user.id,
        resume_id=profile.resume_id,
        job_id=job.id,
        match_score=gap_result["match_score"],
        strong_matches=gap_result["strong_matches"],
        partial_matches=gap_result["partial_matches"],
        missing_skills=gap_result["missing_skills"],
        recommended_priorities=gap_result["recommended_priorities"]
    )
    db.add(skill_gap_rec)
    db.commit()
    db.refresh(skill_gap_rec)

    return SkillGapResponse(
        id=skill_gap_rec.id,
        match_score=skill_gap_rec.match_score,
        strong_matches=skill_gap_rec.strong_matches or [],
        partial_matches=skill_gap_rec.partial_matches or [],
        missing_skills=skill_gap_rec.missing_skills or [],
        recommended_priorities=skill_gap_rec.recommended_priorities or [],
        created_at=skill_gap_rec.created_at
    )

@router.get("/skill-gap/latest", response_model=Optional[SkillGapResponse])
def get_latest_skill_gap(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    gap = (
        db.query(SkillGap)
        .filter(SkillGap.user_id == current_user.id)
        .order_by(SkillGap.created_at.desc())
        .first()
    )
    if not gap:
        return None
    return gap
