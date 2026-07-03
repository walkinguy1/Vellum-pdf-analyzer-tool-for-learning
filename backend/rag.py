from typing import List, Tuple

from google import genai

from config import GEMINI_API_KEY, GENERATION_MODEL
from pdf_processor import Chunk

_client = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=GEMINI_API_KEY)
    return _client

SYSTEM_PROMPT = (
    "You are a document assistant. Answer the user's question using ONLY the "
    "numbered context passages below, which come from a PDF the user uploaded. "
    "If the answer isn't in the context, say so clearly instead of guessing. "
    "Be concise and direct. Write naturally, as if you simply know the document - "
    "do not say things like 'according to the context' or reference passage numbers."
)


def build_prompt(question: str, hits: List[Tuple[Chunk, float]]) -> str:
    context_blocks = [
        f"[{i}] (page {chunk.page}) {chunk.text}"
        for i, (chunk, _score) in enumerate(hits, start=1)
    ]
    context = "\n\n".join(context_blocks)
    return (
        f"{SYSTEM_PROMPT}\n\n"
        f"Context:\n{context}\n\n"
        f"Question: {question}\n\n"
        f"Answer:"
    )


def generate_answer(question: str, hits: List[Tuple[Chunk, float]]) -> str:
    prompt = build_prompt(question, hits)
    response = _get_client().models.generate_content(
        model=GENERATION_MODEL,
        contents=prompt,
    )
    return response.text.strip()
