import json
import re

from openai import OpenAI

from app.config import get_settings
from app.services.document_processor import parse_questions_from_ai

settings = get_settings()

MAX_GENERATION_COUNT = 50
AI_BATCH_SIZE = 12


def get_openai_client() -> OpenAI | None:
    api_key = settings.openrouter_api_key or settings.openai_api_key
    if not api_key:
        return None

    if settings.openrouter_api_key:
        return OpenAI(api_key=settings.openrouter_api_key, base_url="https://openrouter.ai/api/v1")

    return OpenAI(api_key=settings.openai_api_key)


def _normalize_question(raw: dict, index: int) -> dict:
    return {
        "question_text": str(raw.get("question_text", f"Review question {index + 1} about the document.")).strip(),
        "option_a": str(raw.get("option_a", "Option A")).strip(),
        "option_b": str(raw.get("option_b", "Option B")).strip(),
        "option_c": str(raw.get("option_c", "Option C")).strip(),
        "option_d": str(raw.get("option_d", "Option D")).strip(),
        "correct_answer": str(raw.get("correct_answer", "A")).upper()[:1] or "A",
        "explanation": raw.get("explanation") or "Based on the uploaded document content.",
        "difficulty": raw.get("difficulty", "medium"),
        "question_type": raw.get("question_type", "multiple_choice"),
        "topic": raw.get("topic") or "General",
    }


def _extract_content_chunks(text: str) -> list[str]:
    chunks: list[str] = []
    seen: set[str] = set()

    def add_chunk(value: str) -> None:
        cleaned = " ".join(value.split()).strip()
        if len(cleaned) < 25:
            return
        key = cleaned[:120]
        if key in seen:
            return
        seen.add(key)
        chunks.append(cleaned)

    for sentence in re.split(r"[.!?]+", text):
        add_chunk(sentence)

    for paragraph in text.split("\n"):
        add_chunk(paragraph)

    words = text.split()
    for index in range(0, len(words), 35):
        add_chunk(" ".join(words[index : index + 35]))

    return chunks


def _generic_template_question(index: int, excerpt: str) -> dict:
    snippet = excerpt[:160].strip() or "the uploaded learning material"
    return {
        "question_text": f"According to the document (section {index + 1}), which statement is most accurate?",
        "option_a": f"This section of the material discusses: \"{snippet[:80]}...\"",
        "option_b": "The document does not contain any educational content",
        "option_c": "The section is unrelated to the main topic",
        "option_d": "The section only lists references without explanation",
        "correct_answer": "A",
        "explanation": "This question is derived from extracted document content.",
        "difficulty": "medium",
        "question_type": "multiple_choice",
        "topic": "Document Review",
    }


def _fallback_questions(text: str, count: int, start_index: int = 0) -> list[dict]:
    chunks = _extract_content_chunks(text)
    questions: list[dict] = []

    for offset in range(count):
        index = start_index + offset
        if chunks:
            chunk = chunks[offset % len(chunks)]
            preview = chunk[:140]
            questions.append(
                {
                    "question_text": f"Which option best describes this content: \"{preview}...\"?",
                    "option_a": "It reflects an important point from the document",
                    "option_b": "It contradicts the document's main message",
                    "option_c": "It is unrelated to the document",
                    "option_d": "It is only a formatting note",
                    "correct_answer": "A",
                    "explanation": "This fallback question is generated from document text.",
                    "difficulty": "medium",
                    "question_type": "multiple_choice",
                    "topic": "General",
                }
            )
        else:
            questions.append(_generic_template_question(index, text))

    return questions


def _collect_ai_questions(client: OpenAI, excerpt: str, count: int) -> list[dict]:
    collected: list[dict] = []
    seen: set[str] = set()
    attempts = 0
    max_attempts = max(3, (count // AI_BATCH_SIZE) + 2)

    while len(collected) < count and attempts < max_attempts:
        remaining = count - len(collected)
        batch_size = min(remaining, AI_BATCH_SIZE)
        existing_topics = ", ".join(q["question_text"][:60] for q in collected[:5])
        avoid_clause = (
            f"Avoid repeating these questions: {existing_topics}."
            if existing_topics
            else ""
        )

        prompt = f"""Generate exactly {batch_size} unique multiple-choice questions from the document text below.
Return ONLY valid JSON in this format:
{{
  "questions": [
    {{
      "question_text": "...",
      "option_a": "...",
      "option_b": "...",
      "option_c": "...",
      "option_d": "...",
      "correct_answer": "A",
      "explanation": "...",
      "difficulty": "medium",
      "question_type": "multiple_choice",
      "topic": "..."
    }}
  ]
}}

{avoid_clause}

Document text:
{excerpt}
"""

        response = client.chat.completions.create(
            model=settings.ai_model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You create educational multiple-choice questions. "
                        "Respond with JSON only and provide the exact number requested."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.5,
            max_tokens=min(8000, 400 + batch_size * 350),
        )

        content = response.choices[0].message.content or ""
        parsed = parse_questions_from_ai(content)

        for raw in parsed:
            normalized = _normalize_question(raw, len(collected))
            key = normalized["question_text"][:100].lower()
            if key in seen:
                continue
            seen.add(key)
            collected.append(normalized)
            if len(collected) >= count:
                break

        attempts += 1

    return collected


def generate_questions_from_text(text: str, count: int) -> list[dict]:
    target = max(1, min(int(count), MAX_GENERATION_COUNT))
    excerpt = text[:16000] if len(text) > 16000 else text

    collected: list[dict] = []
    client = get_openai_client()
    if client:
        collected = _collect_ai_questions(client, excerpt, target)

    if len(collected) < target:
        fallback = _fallback_questions(excerpt, target - len(collected), start_index=len(collected))
        seen = {q["question_text"][:100].lower() for q in collected}
        for question in fallback:
            key = question["question_text"][:100].lower()
            if key in seen:
                continue
            seen.add(key)
            collected.append(question)
            if len(collected) >= target:
                break

    while len(collected) < target:
        collected.append(_generic_template_question(len(collected), excerpt))

    return collected[:target]
