from pydantic import BaseModel


class QuestionResponse(BaseModel):
    id: int
    document_id: int
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_answer: str
    explanation: str | None = None
    difficulty: str
    question_type: str
    topic: str | None = None

    model_config = {"from_attributes": True}


class QuestionCreate(BaseModel):
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_answer: str
    explanation: str | None = None
    difficulty: str = "medium"
    question_type: str = "multiple_choice"
    topic: str | None = None
