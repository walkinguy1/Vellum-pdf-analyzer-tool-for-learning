from typing import List, Optional, Literal
from pydantic import BaseModel


class StatusStep(BaseModel):
    label: str
    state: Literal["done", "active", "pending"]


class StatusResponse(BaseModel):
    doc_id: str
    filename: str
    stage: Literal["extracting", "chunking", "embedding", "ready", "error"]
    pages: int = 0
    chunks: int = 0
    embedded: int = 0
    total: int = 0
    steps: List[StatusStep] = []
    error: Optional[str] = None


class AskRequest(BaseModel):
    doc_id: str
    question: str


class Source(BaseModel):
    page: int
    score: float
    snippet: str


class AskResponse(BaseModel):
    answer: str
    sources: List[Source]


class DocumentInfo(BaseModel):
    doc_id: str
    filename: str
    pages: int
    chunks: int
    indexed: bool
