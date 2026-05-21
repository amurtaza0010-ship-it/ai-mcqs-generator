import json
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models.document import Document
from app.models.question import Question
from app.models.quiz import Quiz, QuizAttempt
from app.models.quiz_answer import QuizAnswer
from app.models.user import User
from app.schemas.quiz import (
    QuizCreate,
    QuizResponse,
    QuizSubmitRequest,
    QuizSubmitResponse,
    QuestionReview,
    QuizResultResponse,
)

router = APIRouter()


def _get_quiz_questions(db: Session, quiz: Quiz) -> list[Question]:
    questions_query = db.query(Question).filter(Question.document_id == quiz.document_id)
    if quiz.difficulty != "all":
        questions_query = questions_query.filter(Question.difficulty == quiz.difficulty)

    available = questions_query.count()
    if available == 0 and quiz.difficulty != "all":
        questions_query = db.query(Question).filter(Question.document_id == quiz.document_id)
        available = questions_query.count()

    if available == 0:
        return []

    requested = max(1, quiz.question_count)
    limit = min(requested, available)
    return questions_query.limit(limit).all()


@router.get("", response_model=list[QuizResponse])
def list_quizzes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Quiz)
        .filter(Quiz.user_id == current_user.id)
        .order_by(Quiz.created_at.desc())
        .all()
    )


@router.post("", response_model=QuizResponse, status_code=status.HTTP_201_CREATED)
def create_quiz(
    payload: QuizCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    question_count = max(1, payload.question_count)
    if payload.document_id is not None:
        document = (
            db.query(Document)
            .filter(Document.id == payload.document_id, Document.user_id == current_user.id)
            .first()
        )
        if not document:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

        available = (
            db.query(Question).filter(Question.document_id == payload.document_id).count()
        )
        if available == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Document has no questions. Process the document first.",
            )
        question_count = min(question_count, available)

    quiz = Quiz(
        user_id=current_user.id,
        title=payload.title,
        description=payload.description,
        document_id=payload.document_id,
        time_limit_minutes=payload.time_limit_minutes,
        difficulty=payload.difficulty,
        question_count=question_count,
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    return quiz


@router.get("/{quiz_id}", response_model=QuizResponse)
def get_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.user_id == current_user.id).first()
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    return quiz


@router.post("/{quiz_id}/submit", response_model=QuizSubmitResponse)
def submit_quiz(
    quiz_id: int,
    payload: QuizSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.user_id == current_user.id).first()
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    if quiz.document_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Quiz has no linked document")

    questions = _get_quiz_questions(db, quiz)
    if not questions:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No questions available for this quiz")

    normalized_answers = {
        int(key): (value or "").strip().upper()[:1] if value else ""
        for key, value in (payload.answers or {}).items()
    }

    score = 0
    for question in questions:
        submitted = normalized_answers.get(question.id, "")
        if submitted and submitted == question.correct_answer.upper():
            score += 1

    total = len(questions)
    time_taken = payload.time_taken_seconds or 0
    
    attempt = QuizAttempt(
        quiz_id=quiz.id,
        user_id=current_user.id,
        score=score,
        total_questions=total,
        answers_json=json.dumps(normalized_answers),
        time_taken_seconds=time_taken,
        started_at=datetime.utcnow(),
        completed_at=datetime.utcnow(),
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    # Track individual answers
    for question in questions:
        selected_answer = normalized_answers.get(question.id, "")
        is_correct = bool(
            selected_answer and selected_answer == question.correct_answer.upper()
        )

        quiz_answer = QuizAnswer(
            attempt_id=attempt.id,
            question_id=question.id,
            selected_answer=selected_answer,
            is_correct=is_correct,
        )
        db.add(quiz_answer)
    
    db.commit()

    return QuizSubmitResponse(
        attempt_id=attempt.id,
        score=score,
        total_questions=total,
        percentage=round((score / total) * 100, 2) if total else 0.0,
        time_taken_seconds=time_taken,
    )


@router.post("/{quiz_id}/start")
def start_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.user_id == current_user.id).first()
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    if quiz.document_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Quiz has no linked document")

    questions = _get_quiz_questions(db, quiz)

    if not questions:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No questions available for this quiz")

    return {
        "quiz_id": quiz.id,
        "title": quiz.title,
        "time_limit_minutes": quiz.time_limit_minutes,
        "question_count": len(questions),
        "questions": [
            {
                "id": q.id,
                "question_text": q.question_text,
                "option_a": q.option_a,
                "option_b": q.option_b,
                "option_c": q.option_c,
                "option_d": q.option_d,
            }
            for q in questions
        ],
    }


@router.get("/attempts/{attempt_id}", response_model=QuizResultResponse)
def get_quiz_result(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    attempt = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.id == attempt_id, QuizAttempt.user_id == current_user.id)
        .first()
    )
    if not attempt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attempt not found")

    quiz = db.query(Quiz).filter(Quiz.id == attempt.quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    quiz_answers = (
        db.query(QuizAnswer)
        .filter(QuizAnswer.attempt_id == attempt.id)
        .all()
    )
    if not quiz_answers:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No answers found for this attempt")

    question_ids = [answer.question_id for answer in quiz_answers]
    questions = (
        db.query(Question)
        .filter(Question.id.in_(question_ids))
        .all()
    )
    questions_by_id = {question.id: question for question in questions}

    question_reviews = []
    for quiz_answer in quiz_answers:
        question = questions_by_id.get(quiz_answer.question_id)
        if not question:
            continue

        question_reviews.append(
            QuestionReview(
                question_id=question.id,
                question_text=question.question_text,
                option_a=question.option_a,
                option_b=question.option_b,
                option_c=question.option_c,
                option_d=question.option_d,
                correct_answer=question.correct_answer,
                selected_answer=quiz_answer.selected_answer if quiz_answer.selected_answer else None,
                is_correct=quiz_answer.is_correct,
                explanation=question.explanation,
            )
        )

    return QuizResultResponse(
        attempt_id=attempt.id,
        quiz_id=quiz.id,
        quiz_title=quiz.title,
        score=attempt.score,
        total_questions=attempt.total_questions,
        percentage=round((attempt.score / attempt.total_questions) * 100, 2) if attempt.total_questions else 0.0,
        time_taken_seconds=attempt.time_taken_seconds,
        started_at=attempt.started_at,
        completed_at=attempt.completed_at,
        questions=question_reviews,
    )


@router.get("/attempts")
def list_attempts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    attempts = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.user_id == current_user.id)
        .order_by(QuizAttempt.completed_at.desc())
        .all()
    )
    
    return [
        {
            "id": attempt.id,
            "quiz_id": attempt.quiz_id,
            "score": attempt.score,
            "total_questions": attempt.total_questions,
            "percentage": round((attempt.score / attempt.total_questions) * 100, 2) if attempt.total_questions else 0.0,
            "time_taken_seconds": attempt.time_taken_seconds,
            "completed_at": attempt.completed_at,
        }
        for attempt in attempts
    ]


@router.get("/analytics/overview")
def get_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    attempts = db.query(QuizAttempt).filter(QuizAttempt.user_id == current_user.id).all()
    
    if not attempts:
        return {
            "total_attempts": 0,
            "average_score": 0,
            "average_percentage": 0,
            "total_time_spent": 0,
            "best_score": 0,
        }
    
    total_attempts = len(attempts)
    total_score = sum(attempt.score for attempt in attempts)
    total_questions = sum(attempt.total_questions for attempt in attempts)
    total_time = sum(attempt.time_taken_seconds for attempt in attempts)
    best_score = max(attempt.score for attempt in attempts)
    
    return {
        "total_attempts": total_attempts,
        "average_score": round(total_score / total_attempts, 2),
        "average_percentage": round((total_score / total_questions) * 100, 2) if total_questions else 0.0,
        "total_time_spent": total_time,
        "best_score": best_score,
    }
