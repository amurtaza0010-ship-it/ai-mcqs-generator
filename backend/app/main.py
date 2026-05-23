from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import Base, engine
from app.routers import analytics, auth, document, export, questions, quiz, upload

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="AI MCQ Generator API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",  # ✅ regex se sab Vercel URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    )

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(upload.router, prefix="/api/v1/upload", tags=["upload"])
app.include_router(document.router, prefix="/api/v1/document", tags=["document"])
app.include_router(questions.router, prefix="/api/v1/questions", tags=["questions"])
app.include_router(quiz.router, prefix="/api/v1/quiz", tags=["quiz"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["analytics"])
app.include_router(export.router, prefix="/api/v1/export", tags=["export"])


@app.get("/health")
def health_check():
    return {"status": "ok"}
