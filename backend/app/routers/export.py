import io

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models.question import Question
from app.models.quiz import Quiz
from app.models.user import User

router = APIRouter()


@router.get("/quiz/{quiz_id}")
def export_quiz_pdf(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.user_id == current_user.id).first()
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    if quiz.document_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Quiz has no linked document")

    questions = db.query(Question).filter(Question.document_id == quiz.document_id).all()
    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    y = height - 72

    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawString(72, y, quiz.title)
    y -= 36

    pdf.setFont("Helvetica", 11)
    for index, question in enumerate(questions, start=1):
        if y < 100:
            pdf.showPage()
            y = height - 72
            pdf.setFont("Helvetica", 11)

        pdf.drawString(72, y, f"{index}. {question.question_text[:90]}")
        y -= 18
        for label, option in zip("ABCD", [question.option_a, question.option_b, question.option_c, question.option_d]):
            pdf.drawString(90, y, f"{label}. {option[:80]}")
            y -= 16
        y -= 10

    pdf.save()
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="quiz-{quiz.id}.pdf"'},
    )
