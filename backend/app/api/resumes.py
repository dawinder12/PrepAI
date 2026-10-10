from typing import Optional, List
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import User, Resume, CandidateProfile
from app.schemas.schemas import ResumeResponse, CandidateProfileSchema
from app.api.deps import get_current_user
from app.services.resume_parser import resume_parser
from app.core.config import settings

router = APIRouter(prefix="/resumes", tags=["Resumes"])

@router.post("/upload", response_model=ResumeResponse)
async def upload_resume(
    file: Optional[UploadFile] = File(None),
    raw_text: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    extracted_text = ""
    filename = "pasted_resume.txt"
    file_type = "text"

    if file:
        filename = file.filename or "uploaded_resume"
        content_bytes = await file.read()
        if len(content_bytes) > settings.MAX_UPLOAD_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="File size exceeds the 10MB maximum limit."
            )
        file_type = filename.split(".")[-1].lower() if "." in filename else "unknown"
        extracted_text = resume_parser.extract_text(content_bytes, filename)
    elif raw_text:
        extracted_text = raw_text.strip()
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a resume file (PDF/DOCX) or paste resume text."
        )

    if not extracted_text or len(extracted_text.strip()) < 20:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not extract readable text from the provided resume. Please check the file formatting."
        )

    # Parse structured profile
    parsed_dict = await resume_parser.parse_profile(extracted_text)

    # Create Resume DB record
    resume_record = Resume(
        user_id=current_user.id,
        filename=filename,
        file_type=file_type,
        raw_text=extracted_text
    )
    db.add(resume_record)
    db.flush()

    # Create or update CandidateProfile DB record
    existing_profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    if existing_profile:
        db.delete(existing_profile)
        db.flush()

    profile_record = CandidateProfile(
        user_id=current_user.id,
        resume_id=resume_record.id,
        full_name=parsed_dict.get("full_name") or current_user.full_name,
        email=parsed_dict.get("email") or current_user.email,
        phone=parsed_dict.get("phone"),
        summary=parsed_dict.get("summary"),
        skills=parsed_dict.get("skills", []),
        experience=parsed_dict.get("experience", []),
        education=parsed_dict.get("education", []),
        projects=parsed_dict.get("projects", []),
        certifications=parsed_dict.get("certifications", []),
        achievements=parsed_dict.get("achievements", []),
        years_of_experience=parsed_dict.get("years_of_experience", 0.0)
    )
    db.add(profile_record)
    db.commit()
    db.refresh(resume_record)

    return ResumeResponse(
        id=resume_record.id,
        filename=resume_record.filename,
        file_type=resume_record.file_type,
        created_at=resume_record.created_at,
        profile=CandidateProfileSchema(
            full_name=profile_record.full_name,
            email=profile_record.email,
            phone=profile_record.phone,
            summary=profile_record.summary,
            skills=profile_record.skills or [],
            experience=profile_record.experience or [],
            education=profile_record.education or [],
            projects=profile_record.projects or [],
            certifications=profile_record.certifications or [],
            achievements=profile_record.achievements or [],
            years_of_experience=profile_record.years_of_experience or 0.0
        )
    )

@router.get("/latest", response_model=Optional[ResumeResponse])
def get_latest_resume(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = (
        db.query(Resume)
        .filter(Resume.user_id == current_user.id)
        .order_by(Resume.created_at.desc())
        .first()
    )
    if not resume:
        return None

    profile = db.query(CandidateProfile).filter(CandidateProfile.resume_id == resume.id).first()
    return ResumeResponse(
        id=resume.id,
        filename=resume.filename,
        file_type=resume.file_type,
        created_at=resume.created_at,
        profile=CandidateProfileSchema(
            full_name=profile.full_name if profile else None,
            email=profile.email if profile else None,
            phone=profile.phone if profile else None,
            summary=profile.summary if profile else None,
            skills=profile.skills or [] if profile else [],
            experience=profile.experience or [] if profile else [],
            education=profile.education or [] if profile else [],
            projects=profile.projects or [] if profile else [],
            certifications=profile.certifications or [] if profile else [],
            achievements=profile.achievements or [] if profile else [],
            years_of_experience=profile.years_of_experience or 0.0 if profile else 0.0
        ) if profile else None
    )
