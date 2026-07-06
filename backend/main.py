import os
import shutil
import threading
import uuid
from typing import Optional

import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from config import TOP_K, UPLOAD_DIR
from embeddings import embed_query, embed_texts
from models import AskRequest, AskResponse, DocumentInfo, Source, StatusResponse, StatusStep
from pdf_processor import chunk_pages, extract_pages
from rag import RetrievedChunk, generate_answer
from vector_store import VectorStore

app = FastAPI(title="Vellum API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory document store. Fine for a demo/single-user deployment;
# swap for Redis/DB if this needs to survive restarts or scale to many users.
DOCS: dict = {}


def _get_candidate_doc_ids(doc_ids: Optional[list[str]]) -> list[str]:
    if doc_ids:
        return [doc_id for doc_id in doc_ids if doc_id in DOCS]
    return list(DOCS.keys())


def process_document(doc_id: str, pdf_path: str) -> None:
    doc = DOCS[doc_id]
    try:
        doc["stage"] = "extracting"
        pages = extract_pages(pdf_path)
        doc["pages"] = len(pages)

        doc["stage"] = "chunking"
        chunks = chunk_pages(pages)
        doc["total"] = len(chunks)

        doc["stage"] = "embedding"
        from config import EMBED_BATCH_SIZE

        vector_batches = []
        for start in range(0, len(chunks), EMBED_BATCH_SIZE):
            batch = chunks[start : start + EMBED_BATCH_SIZE]
            vector_batches.append(embed_texts([c.text for c in batch]))
            doc["embedded"] = min(start + EMBED_BATCH_SIZE, len(chunks))

        dim = vector_batches[0].shape[1] if vector_batches else 768
        all_vectors = np.vstack(vector_batches) if vector_batches else np.zeros((0, dim), dtype="float32")

        store = VectorStore(dim=dim)
        store.add(all_vectors, chunks)
        doc["store"] = store
        doc["stage"] = "ready"
    except Exception as exc:  # noqa: BLE001 - surface any failure to the client
        doc["stage"] = "error"
        doc["error"] = str(exc)


@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are supported")

    doc_id = uuid.uuid4().hex[:12]
    pdf_path = os.path.join(UPLOAD_DIR, f"{doc_id}.pdf")
    with open(pdf_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    DOCS[doc_id] = {
        "filename": file.filename,
        "stage": "extracting",
        "pages": 0,
        "total": 0,
        "embedded": 0,
        "store": None,
        "error": None,
    }

    threading.Thread(target=process_document, args=(doc_id, pdf_path), daemon=True).start()

    return {"doc_id": doc_id, "filename": file.filename}


@app.get("/status/{doc_id}", response_model=StatusResponse)
async def get_status(doc_id: str):
    doc = DOCS.get(doc_id)
    if not doc:
        raise HTTPException(404, "Document not found")

    stage = doc["stage"]
    pages_label = doc["pages"] if doc["pages"] else "…"
    chunks_label = doc["total"] if doc["total"] else "…"

    steps = [
        StatusStep(
            label=f"Extracted text from {pages_label} pages",
            state="done" if stage != "extracting" else "active",
        ),
        StatusStep(
            label=f"Split into {chunks_label} chunks",
            state="done" if stage in ("embedding", "ready") else ("active" if stage == "chunking" else "pending"),
        ),
        StatusStep(
            label=f"Generating embeddings… {doc['embedded']} of {doc['total']}",
            state="done" if stage == "ready" else ("active" if stage == "embedding" else "pending"),
        ),
        StatusStep(
            label="Ready to answer questions",
            state="done" if stage == "ready" else "pending",
        ),
    ]

    return StatusResponse(
        doc_id=doc_id,
        filename=doc["filename"],
        stage=stage,
        pages=doc["pages"],
        chunks=doc["total"],
        embedded=doc["embedded"],
        total=doc["total"],
        steps=steps,
        error=doc["error"],
    )


@app.get("/document/{doc_id}", response_model=DocumentInfo)
async def get_document(doc_id: str):
    doc = DOCS.get(doc_id)
    if not doc:
        raise HTTPException(404, "Document not found")
    return DocumentInfo(
        doc_id=doc_id,
        filename=doc["filename"],
        pages=doc["pages"],
        chunks=doc["total"],
        indexed=doc["stage"] == "ready",
    )


@app.post("/ask", response_model=AskResponse)
async def ask_question(req: AskRequest):
    doc_ids = _get_candidate_doc_ids(req.doc_ids or [req.doc_id])
    if not doc_ids:
        raise HTTPException(404, "Document not found")

    query_vec = embed_query(req.question)
    candidates: list[tuple[float, RetrievedChunk]] = []
    selected_docs_are_indexing = False

    for doc_id in doc_ids:
        doc = DOCS.get(doc_id)
        if not doc:
            continue
        if doc["stage"] != "ready" or not doc["store"]:
            selected_docs_are_indexing = True
            continue

        store: VectorStore = doc["store"]
        hits = store.search(query_vec, TOP_K)
        for chunk, score in hits:
            candidates.append(
                (
                    score,
                    RetrievedChunk(
                        filename=doc["filename"],
                        page=chunk.page,
                        text=chunk.text,
                    ),
                )
            )

    if not candidates:
        if selected_docs_are_indexing:
            raise HTTPException(409, "Selected documents are still being indexed")
        return AskResponse(answer="I couldn't find relevant content in the selected documents.", sources=[])

    ranked_candidates = sorted(candidates, key=lambda item: item[0], reverse=True)[:TOP_K]
    answer = generate_answer(req.question, [hit for _score, hit in ranked_candidates])

    sources = [
        Source(
            filename=hit.filename,
            page=hit.page,
            score=round(score, 2),
            snippet=hit.text[:180] + ("…" if len(hit.text) > 180 else ""),
        )
        for score, hit in ranked_candidates
    ]
    return AskResponse(answer=answer, sources=sources)


@app.get("/health")
async def health():
    return {"status": "ok"}
