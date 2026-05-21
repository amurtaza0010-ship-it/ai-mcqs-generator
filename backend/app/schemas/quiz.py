from datetime import datetime

from pydantic import BaseModel


class QuizCreate(BaseModel):
    title: str
    description: str | None = None
    document_id: int | None = None
    time_limit_minutes: int | None = None
    difficulty: str = "medium"
    question_count: int = 10


class QuizResponse(BaseModel):
    id: int
    title: str
    description: str | None = None
    document_id: int | None = None
    time_limit_minutes: int | None = None
    difficulty: str
    question_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class QuizSubmitRequest(BaseModel):
    answers: dict[int, str]
    time_taken_seconds: int | None = None


class QuizSubmitResponse(BaseModel):
    attempt_id: int
    score: int
    total_questions: int
    percentage: float
    time_taken_seconds: int


class QuestionReview(BaseModel):
    question_id: int
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_answer: str
    selected_answer: str | None = None
    is_correct: bool
    explanation: str | None = None


class QuizResultResponse(BaseModel):
    attempt_id: int
    quiz_id: int
    quiz_title: str
    score: int
    total_questions: int
    percentage: float
    time_taken_seconds: int
    started_at: datetime
    completed_at: datetime
    questions: list[QuestionReview]

    model_config = {"from_attributes": True}
