from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models.document import Document
from app.models.question import Question
from app.models.user import User
from app.schemas.document import DocumentResponse, ProcessDocumentResponse
from app.services.ai import generate_questions_from_text
from app.services.document_processor import extract_text_from_file

router = APIRouter()


def _serialize_document(document: Document) -> DocumentResponse:
    return DocumentResponse(
        id=document.id,
        filename=document.filename,
        original_filename=document.original_filename,
        file_type=document.file_type,
        status=document.status,
        created_at=document.created_at,
        processed_at=document.processed_at,
        question_count=len(document.questions),
    )


def _get_user_document(db: Session, document_id: int, user_id: int) -> Document:
    document = db.query(Document).filter(Document.id == document_id, Document.user_id == user_id).first()
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return document


@router.get("", response_model=list[DocumentResponse])
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    documents = (
        db.query(Document)
        .filter(Document.user_id == current_user.id)
        .order_by(Document.created_at.desc())
        .all()
    )
    return [_serialize_document(document) for document in documents]


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = _get_user_document(db, document_id, current_user.id)
    return _serialize_document(document)


@router.post("/process/{document_id}", response_model=ProcessDocumentResponse)
def process_document(
    document_id: int,
    question_count: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = _get_user_document(db, document_id, current_user.id)
    document.status = "processing"
    db.commit()

    try:
        extracted_text = extract_text_from_file(document.file_path, document.file_type)
        document.extracted_text = extracted_text
        count = max(1, min(question_count, 50))
        generated = generate_questions_from_text(extracted_text, count)

        db.query(Question).filter(Question.document_id == document.id).delete()

        for item in generated:
            db.add(
                Question(
                    document_id=document.id,
                    question_text=item["question_text"],
                    option_a=item["option_a"],
                    option_b=item["option_b"],
                    option_c=item["option_c"],
                    option_d=item["option_d"],
                    correct_answer=str(item.get("correct_answer", "A")).upper()[:1],
                    explanation=item.get("explanation"),
                    difficulty=item.get("difficulty", "medium"),
                    question_type=item.get("question_type", "multiple_choice"),
                    topic=item.get("topic"),
                )
            )

        document.status = "processed"
        document.processed_at = datetime.utcnow()
        db.commit()

        saved_count = (
            db.query(Question).filter(Question.document_id == document.id).count()
        )

        return ProcessDocumentResponse(
            document_id=document.id,
            status=document.status,
            questions_requested=count,
            questions_generated=saved_count,
            message=(
                f"Document processed successfully. Generated {saved_count} of {count} requested questions."
            ),
        )
    except Exception as exc:
        document.status = "failed"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process document: {exc}",
        ) from exc
