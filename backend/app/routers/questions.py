from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models.document import Document
from app.models.question import Question
from app.models.user import User
from app.schemas.question import QuestionResponse

router = APIRouter()


@router.get("", response_model=list[QuestionResponse])
def list_questions(
    document_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        db.query(Question)
        .join(Document, Question.document_id == Document.id)
        .filter(Document.user_id == current_user.id)
    )
    if document_id is not None:
        query = query.filter(Question.document_id == document_id)
    return query.order_by(Question.id.asc()).all()


@router.get("/{question_id}", response_model=QuestionResponse)
def get_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    question = (
        db.query(Question)
        .join(Document, Question.document_id == Document.id)
        .filter(Question.id == question_id, Document.user_id == current_user.id)
        .first()
    )
    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")
    return question
