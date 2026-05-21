from datetime import datetime

from pydantic import BaseModel


class DocumentResponse(BaseModel):
    id: int
    filename: str
    original_filename: str
    file_type: str
    status: str
    created_at: datetime
    processed_at: datetime | None = None
    question_count: int = 0

    model_config = {"from_attributes": True}


class ProcessDocumentResponse(BaseModel):
    document_id: int
    status: str
    questions_requested: int
    questions_generated: int
    message: str
