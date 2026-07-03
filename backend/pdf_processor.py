from dataclasses import dataclass
from typing import List

import fitz  # PyMuPDF

from config import CHUNK_SIZE, CHUNK_OVERLAP


@dataclass
class Chunk:
    text: str
    page: int  # 1-indexed page number


def extract_pages(pdf_path: str) -> List[str]:
    """Extract raw text per page from a PDF."""
    doc = fitz.open(pdf_path)
    pages = [page.get_text("text") for page in doc]
    doc.close()
    return pages


def chunk_pages(pages: List[str]) -> List[Chunk]:
    """Split each page's text into overlapping character-window chunks,
    keeping track of which page each chunk came from."""
    chunks: List[Chunk] = []

    for i, raw_text in enumerate(pages):
        page_num = i + 1
        text = " ".join(raw_text.split())  # normalize whitespace
        if not text:
            continue

        start = 0
        while start < len(text):
            end = min(start + CHUNK_SIZE, len(text))
            chunks.append(Chunk(text=text[start:end], page=page_num))
            if end == len(text):
                break
            start = end - CHUNK_OVERLAP

    return chunks
