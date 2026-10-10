from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import User, Document
from app.schemas.schemas import DocumentResponse, DocumentQueryRequest, DocumentQueryResponse, DocumentChunkResult
from app.api.deps import get_current_user
from app.services.rag_service import rag_service
from app.core.config import settings

router = APIRouter(prefix="/documents", tags=["RAG Documents"])

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    topic: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    filename = file.filename or "uploaded_study_material.txt"
    content_bytes = await file.read()
    if len(content_bytes) > settings.MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size exceeds the 10MB maximum limit."
        )

    doc_record = await rag_service.index_document(
        db=db,
        user_id=current_user.id,
        filename=filename,
        file_bytes=content_bytes,
        topic=topic
    )

    return DocumentResponse(
        id=doc_record.id,
        filename=doc_record.filename,
        topic=doc_record.topic,
        file_type=doc_record.file_type,
        char_count=doc_record.char_count,
        created_at=doc_record.created_at
    )

@router.get("/", response_model=List[DocumentResponse])
def get_user_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    docs = (
        db.query(Document)
        .filter(Document.user_id == current_user.id)
        .order_by(Document.created_at.desc())
        .all()
    )
    return docs

@router.post("/query", response_model=DocumentQueryResponse)
async def query_knowledge_base(
    payload: DocumentQueryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not payload.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    results = await rag_service.query_user_documents(
        db=db,
        user_id=current_user.id,
        query=payload.query,
        limit=payload.limit
    )

    return DocumentQueryResponse(
        query=payload.query,
        results=[
            DocumentChunkResult(
                chunk_index=r["chunk_index"],
                content=r["content"],
                similarity_score=r["similarity_score"],
                document_filename=r["document_filename"]
            ) for r in results
        ]
    )
