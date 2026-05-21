from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models.document import Document
from app.models.question import Question
from app.models.quiz import Quiz, QuizAttempt
from app.models.user import User

router = APIRouter()


@router.get("/overview")
def analytics_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    documents_count = db.query(func.count(Document.id)).filter(Document.user_id == current_user.id).scalar() or 0
    quizzes_count = db.query(func.count(Quiz.id)).filter(Quiz.user_id == current_user.id).scalar() or 0
    questions_count = (
        db.query(func.count(Question.id))
        .join(Document, Question.document_id == Document.id)
        .filter(Document.user_id == current_user.id)
        .scalar()
        or 0
    )
    attempts = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.user_id == current_user.id)
        .order_by(QuizAttempt.completed_at.desc())
        .limit(10)
        .all()
    )
    all_attempts = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.user_id == current_user.id)
        .all()
    )
    average_score = (
        db.query(func.avg(QuizAttempt.score)).filter(QuizAttempt.user_id == current_user.id).scalar() or 0
    )

    total_attempts = len(all_attempts)
    if total_attempts:
        total_score = sum(attempt.score for attempt in all_attempts)
        total_questions_answered = sum(attempt.total_questions for attempt in all_attempts)
        average_percentage = round((total_score / total_questions_answered) * 100, 2) if total_questions_answered else 0.0
        best_percentage = max(
            round((attempt.score / attempt.total_questions) * 100, 2) if attempt.total_questions else 0.0
            for attempt in all_attempts
        )
        total_time_spent = sum(attempt.time_taken_seconds for attempt in all_attempts)
    else:
        average_percentage = 0.0
        best_percentage = 0.0
        total_time_spent = 0

    quiz_titles = {
        quiz.id: quiz.title
        for quiz in db.query(Quiz).filter(Quiz.user_id == current_user.id).all()
    }

    return {
        "documents_count": documents_count,
        "quizzes_count": quizzes_count,
        "questions_count": questions_count,
        "average_score": round(float(average_score), 2),
        "recent_attempts": [
            {
                "id": attempt.id,
                "quiz_id": attempt.quiz_id,
                "quiz_title": quiz_titles.get(attempt.quiz_id, "Quiz"),
                "score": attempt.score,
                "total_questions": attempt.total_questions,
                "percentage": round((attempt.score / attempt.total_questions) * 100, 2)
                if attempt.total_questions
                else 0.0,
                "time_taken_seconds": attempt.time_taken_seconds,
                "completed_at": attempt.completed_at.isoformat() if attempt.completed_at else None,
            }
            for attempt in attempts
        ],
        "performance_stats": {
            "total_attempts": total_attempts,
            "average_percentage": average_percentage,
            "best_percentage": best_percentage,
            "total_time_spent": total_time_spent,
        },
    }
