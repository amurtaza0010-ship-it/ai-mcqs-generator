import json
import re
from pathlib import Path

import pdfplumber
from docx import Document as DocxDocument


def extract_text_from_file(file_path: str, file_type: str) -> str:
    path = Path(file_path)
    ext = file_type.lower().lstrip(".")

    if ext == "pdf":
        text_parts: list[str] = []
        with pdfplumber.open(path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
        return "\n".join(text_parts).strip()

    if ext in {"docx", "doc"}:
        doc = DocxDocument(path)
        return "\n".join(paragraph.text for paragraph in doc.paragraphs if paragraph.text).strip()

    if ext == "txt":
        return path.read_text(encoding="utf-8", errors="ignore").strip()

    raise ValueError(f"Unsupported file type: {file_type}")


def parse_questions_from_ai(content: str) -> list[dict]:
    content = content.strip()
    if content.startswith("```"):
        content = re.sub(r"^```(?:json)?\s*", "", content)
        content = re.sub(r"\s*```$", "", content)

    try:
        data = json.loads(content)
        if isinstance(data, dict) and "questions" in data:
            return data["questions"]
        if isinstance(data, list):
            return data
    except json.JSONDecodeError:
        pass

    return []
