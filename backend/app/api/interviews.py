from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import (
    User, CandidateProfile, JobDescription, InterviewSession,
    InterviewQuestion, InterviewAnswer, AnswerEvaluation, ProgressRecord
)
from app.schemas.schemas import (
    InterviewStartRequest, InterviewSessionResponse, InterviewQuestionDetail,
    InterviewAnswerSubmitRequest, AnswerEvaluationDetail
)
from app.api.deps import get_current_user
from app.agents.interview_agent import interview_workflow, InterviewState
from app.services.llm_service import llm_service

router = APIRouter(prefix="/interviews", tags=["Mock Interviews"])

@router.post("/start", response_model=InterviewSessionResponse)
async def start_interview(
    payload: InterviewStartRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
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

    target_role = (
        payload.target_role
        or (job.role_type if job and job.role_type else None)
        or (job.title if job else None)
        or current_user.target_role
        or "Software Engineer"
    )

    total_q = max(1, min(10, payload.total_questions))

    # Initialize LangGraph state
    cand_profile_dict = {
        "summary": profile.summary if profile else "",
        "skills": profile.skills if profile else ["Python", "Backend"],
    }
    job_req_dict = {
        "role_type": target_role,
        "required_skills": (job.required_skills if job and job.required_skills else ["System Architecture", "Concurrency", "APIs"]),
    }

    initial_state: InterviewState = {
        "candidate_profile": cand_profile_dict,
        "job_requirements": job_req_dict,
        "interview_type": payload.interview_type,
        "difficulty": payload.difficulty,
        "total_questions": total_q,
        "question_number": 1,
        "retrieved_context": "",
        "current_question": {},
        "candidate_answer": "",
        "current_evaluation": {},
        "interview_history": [],
        "weak_topics": [],
        "strong_topics": [],
        "final_score": None,
        "is_complete": False
    }

    # Run LangGraph initialization node sequence
    context_res = await interview_workflow._determine_context(initial_state)
    initial_state["retrieved_context"] = context_res["retrieved_context"]
    
    knowledge_res = await interview_workflow._retrieve_knowledge(initial_state)
    initial_state["retrieved_context"] += f" | {knowledge_res['retrieved_context']}"

    first_q_res = await interview_workflow._generate_question(initial_state)
    q_data = first_q_res["current_question"]

    # Persist session in DB
    session_rec = InterviewSession(
        user_id=current_user.id,
        target_role=target_role,
        interview_type=payload.interview_type,
        difficulty=payload.difficulty,
        total_questions=total_q,
        current_question_index=1,
        is_completed=False
    )
    db.add(session_rec)
    db.flush()

    # Persist first question
    first_q_rec = InterviewQuestion(
        session_id=session_rec.id,
        order_index=1,
        question_text=q_data["question_text"],
        category=q_data.get("category", "Technical"),
        difficulty=payload.difficulty,
        expected_key_points=q_data.get("expected_key_points", [])
    )
    db.add(first_q_rec)
    db.commit()
    db.refresh(session_rec)

    return _format_session_response(session_rec, db)

@router.get("/{session_id}", response_model=InterviewSessionResponse)
def get_interview_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = (
        db.query(InterviewSession)
        .filter(InterviewSession.id == session_id, InterviewSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found.")
    return _format_session_response(session, db)

@router.post("/{session_id}/answer", response_model=InterviewSessionResponse)
async def submit_answer(
    session_id: str,
    payload: InterviewAnswerSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = (
        db.query(InterviewSession)
        .filter(InterviewSession.id == session_id, InterviewSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found.")

    if session.is_completed:
        raise HTTPException(status_code=400, detail="This interview has already been completed.")

    # Find the current unanswered question
    questions = (
        db.query(InterviewQuestion)
        .filter(InterviewQuestion.session_id == session.id)
        .order_by(InterviewQuestion.order_index)
        .all()
    )
    current_q = questions[-1] if questions else None
    if not current_q:
        raise HTTPException(status_code=400, detail="No active question found for this interview.")

    # Save answer
    answer_rec = InterviewAnswer(
        question_id=current_q.id,
        transcript=payload.transcript,
        duration_seconds=payload.duration_seconds
    )
    db.add(answer_rec)
    db.flush()

    # Reconstruct history for LangGraph state
    history = []
    for q in questions[:-1]:
        ans = db.query(InterviewAnswer).filter(InterviewAnswer.question_id == q.id).first()
        if ans:
            eval_rec = db.query(AnswerEvaluation).filter(AnswerEvaluation.answer_id == ans.id).first()
            if eval_rec:
                history.append({
                    "question": {"question_text": q.question_text, "category": q.category},
                    "answer": ans.transcript,
                    "evaluation": {"overall_score": eval_rec.overall_score}
                })

    current_state: InterviewState = {
        "candidate_profile": {},
        "job_requirements": {"role_type": session.target_role, "required_skills": [current_q.category or "Backend"]},
        "interview_type": session.interview_type,
        "difficulty": session.difficulty,
        "total_questions": session.total_questions,
        "question_number": current_q.order_index,
        "retrieved_context": "",
        "current_question": {
            "question_text": current_q.question_text,
            "category": current_q.category,
            "expected_key_points": current_q.expected_key_points or []
        },
        "candidate_answer": payload.transcript,
        "current_evaluation": {},
        "interview_history": history,
        "weak_topics": session.weak_areas or [],
        "strong_topics": session.strengths or [],
        "final_score": None,
        "is_complete": False
    }

    # Run LangGraph progression step
    updated_state = await interview_workflow.evaluate_and_progress(current_state, payload.transcript)

    eval_data = updated_state["current_evaluation"]
    evaluation_rec = AnswerEvaluation(
        answer_id=answer_rec.id,
        overall_score=eval_data["overall_score"],
        technical_accuracy=eval_data["technical_accuracy"],
        relevance=eval_data["relevance"],
        communication=eval_data["communication"],
        depth=eval_data["depth"],
        strengths=eval_data.get("strengths", []),
        improvements=eval_data.get("improvements", []),
        missing_points=eval_data.get("missing_points", []),
        model_answer_highlights=eval_data.get("model_answer_highlights")
    )
    db.add(evaluation_rec)

    # Check if more questions remain
    if updated_state["is_complete"] or current_q.order_index >= session.total_questions:
        session.is_completed = True
        session.completed_at = datetime.utcnow()
        
        db.flush()
        all_evals = (
            db.query(AnswerEvaluation)
            .join(InterviewAnswer, AnswerEvaluation.answer_id == InterviewAnswer.id)
            .join(InterviewQuestion, InterviewAnswer.question_id == InterviewQuestion.id)
            .filter(InterviewQuestion.session_id == session.id)
            .all()
        )
        if not any(e.id == evaluation_rec.id for e in all_evals):
            all_evals.append(evaluation_rec)

        session.overall_score = round(sum(e.overall_score for e in all_evals) / len(all_evals), 1)
        session.technical_accuracy_score = round(sum(e.technical_accuracy for e in all_evals) / len(all_evals), 1)
        session.communication_score = round(sum(e.communication for e in all_evals) / len(all_evals), 1)
        session.relevance_score = round(sum(e.relevance for e in all_evals) / len(all_evals), 1)
        session.depth_score = round(sum(e.depth for e in all_evals) / len(all_evals), 1)
        session.strengths = updated_state.get("strong_topics", ["Technical clarity"])
        session.weak_areas = updated_state.get("weak_topics", ["Deep architecture trade-offs"])
        session.recommended_topics = [
            f"Review {t} concepts and production edge-cases" for t in (session.weak_areas or ["System Architecture"])
        ]
        session.feedback_summary = (
            f"Demonstrated solid competence across {session.target_role} expectations. "
            f"Continue refining depth in {', '.join(session.weak_areas[:2]) if session.weak_areas else 'system design'}."
        )

        # Log Progress Record
        prog = ProgressRecord(
            user_id=current_user.id,
            metric_type="interview_score",
            value=session.overall_score,
            metadata_info={"session_id": session.id, "role": session.target_role, "difficulty": session.difficulty}
        )
        db.add(prog)

    else:
        # Create the next question generated by LangGraph
        next_q_data = updated_state["current_question"]
        next_q_rec = InterviewQuestion(
            session_id=session.id,
            order_index=current_q.order_index + 1,
            question_text=next_q_data["question_text"],
            category=next_q_data.get("category", "Technical"),
            difficulty=session.difficulty,
            expected_key_points=next_q_data.get("expected_key_points", [])
        )
        db.add(next_q_rec)
        session.current_question_index = current_q.order_index + 1

    db.commit()
    db.refresh(session)

    return _format_session_response(session, db)

@router.post("/{session_id}/complete", response_model=InterviewSessionResponse)
def complete_interview(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = (
        db.query(InterviewSession)
        .filter(InterviewSession.id == session_id, InterviewSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found.")

    if not session.is_completed:
        session.is_completed = True
        session.completed_at = datetime.utcnow()
        all_evals = (
            db.query(AnswerEvaluation)
            .join(InterviewAnswer, AnswerEvaluation.answer_id == InterviewAnswer.id)
            .join(InterviewQuestion, InterviewAnswer.question_id == InterviewQuestion.id)
            .filter(InterviewQuestion.session_id == session.id)
            .all()
        )
        if all_evals:
            session.overall_score = round(sum(e.overall_score for e in all_evals) / len(all_evals), 1)
            session.technical_accuracy_score = round(sum(e.technical_accuracy for e in all_evals) / len(all_evals), 1)
            session.communication_score = round(sum(e.communication for e in all_evals) / len(all_evals), 1)
            session.relevance_score = round(sum(e.relevance for e in all_evals) / len(all_evals), 1)
            session.depth_score = round(sum(e.depth for e in all_evals) / len(all_evals), 1)
        else:
            session.overall_score = 6.0
            session.technical_accuracy_score = 6.0
            session.communication_score = 6.0
            session.relevance_score = 6.0
            session.depth_score = 6.0

        session.strengths = session.strengths or ["Participated in mock interview practice session"]
        session.weak_areas = session.weak_areas or ["Complete all questions in the round for full evaluation"]
        session.recommended_topics = session.recommended_topics or ["Practice full question sessions"]
        session.feedback_summary = session.feedback_summary or (
            f"Interview concluded for {session.target_role}. Review answered questions below."
        )

        prog = ProgressRecord(
            user_id=current_user.id,
            metric_type="interview_score",
            value=session.overall_score,
            metadata_info={"session_id": session.id, "role": session.target_role, "difficulty": session.difficulty}
        )
        db.add(prog)
        db.commit()
        db.refresh(session)

    return _format_session_response(session, db)

@router.post("/transcribe")
async def transcribe_interview_audio(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    try:
        content = await file.read()
        mime_type = file.content_type or "audio/webm"
        transcript = await llm_service.transcribe_audio(content, mime_type)
        return {
            "success": True,
            "transcript": transcript or "",
            "message": "Transcription succeeded" if transcript else "No clear speech detected."
        }
    except Exception as e:
        return {
            "success": False,
            "transcript": "",
            "error": str(e)
        }

@router.get("/", response_model=List[InterviewSessionResponse])
def list_interviews(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sessions = (
        db.query(InterviewSession)
        .filter(InterviewSession.user_id == current_user.id)
        .order_by(InterviewSession.created_at.desc())
        .all()
    )
    return [_format_session_response(s, db) for s in sessions]

def _format_session_response(session: InterviewSession, db: Session) -> InterviewSessionResponse:
    q_list = []
    questions = (
        db.query(InterviewQuestion)
        .filter(InterviewQuestion.session_id == session.id)
        .order_by(InterviewQuestion.order_index)
        .all()
    )
    for q in questions:
        ans = db.query(InterviewAnswer).filter(InterviewAnswer.question_id == q.id).first()
        eval_detail = None
        if ans:
            eval_rec = db.query(AnswerEvaluation).filter(AnswerEvaluation.answer_id == ans.id).first()
            if eval_rec:
                eval_detail = AnswerEvaluationDetail(
                    overall_score=eval_rec.overall_score,
                    technical_accuracy=eval_rec.technical_accuracy,
                    relevance=eval_rec.relevance,
                    communication=eval_rec.communication,
                    depth=eval_rec.depth,
                    strengths=eval_rec.strengths or [],
                    improvements=eval_rec.improvements or [],
                    missing_points=eval_rec.missing_points or [],
                    model_answer_highlights=eval_rec.model_answer_highlights
                )

        q_list.append(InterviewQuestionDetail(
            id=q.id,
            order_index=q.order_index,
            question_text=q.question_text,
            category=q.category,
            difficulty=q.difficulty,
            is_answered=ans is not None,
            evaluation=eval_detail
        ))

    return InterviewSessionResponse(
        id=session.id,
        target_role=session.target_role,
        interview_type=session.interview_type,
        difficulty=session.difficulty,
        total_questions=session.total_questions,
        current_question_index=session.current_question_index,
        is_completed=session.is_completed,
        questions=q_list,
        overall_score=session.overall_score,
        technical_accuracy_score=session.technical_accuracy_score,
        communication_score=session.communication_score,
        relevance_score=session.relevance_score,
        depth_score=session.depth_score,
        strengths=session.strengths or [],
        weak_areas=session.weak_areas or [],
        recommended_topics=session.recommended_topics or [],
        feedback_summary=session.feedback_summary,
        created_at=session.created_at,
        completed_at=session.completed_at
    )
