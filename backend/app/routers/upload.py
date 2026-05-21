import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.deps import get_current_user
from app.models.document import Document
from app.models.user import User
from app.schemas.document import DocumentResponse

router = APIRouter()
settings = get_settings()
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".txt"}


@router.post("", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No file provided")

    extension = Path(file.filename).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type. Allowed: PDF, DOCX, TXT",
        )

    contents = await file.read()
    if len(contents) > settings.max_file_size:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File too large")

    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)

    stored_name = f"{uuid.uuid4().hex}{extension}"
    file_path = upload_dir / stored_name
    file_path.write_bytes(contents)

    document = Document(
        user_id=current_user.id,
        filename=stored_name,
        original_filename=file.filename,
        file_type=extension.lstrip("."),
        file_path=str(file_path),
        status="uploaded",
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    return DocumentResponse(
        id=document.id,
        filename=document.filename,
        original_filename=document.original_filename,
        file_type=document.file_type,
        status=document.status,
        created_at=document.created_at,
        processed_at=document.processed_at,
        question_count=0,
    )
