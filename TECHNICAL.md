# Vellum — Technical Notes

This is the "how it actually works" doc — for understanding/defending the
project, not for setup (see `README.md` for that).

## The core idea: Retrieval-Augmented Generation (RAG)

An LLM can't answer questions about a PDF it's never seen, and you can't
just paste the whole PDF into every prompt (too long, too expensive, and
the model will still hallucinate if it can't find the relevant bit).

RAG solves this by splitting the problem in two:

1. **Retrieval** — find the small handful of passages in the document that
   are actually relevant to the question. This is a search problem, not an
   AI problem — done with vector similarity, not the LLM.
2. **Generation** — hand only those relevant passages to the LLM and ask it
   to answer *using only that context*. This is the AI problem.

This keeps answers grounded (the model can't invent facts not in the
retrieved chunks — or rather, it's instructed not to) and keeps prompts
short and cheap.

## End-to-end flow

```
Upload PDF
   │
   ▼
┌─────────────────────┐
│ 1. Extract text      │  PyMuPDF pulls raw text per page
│    (pdf_processor.py)│  → list of strings, one per page
└─────────────────────┘
   │
   ▼
┌─────────────────────┐
│ 2. Chunk             │  Each page's text is sliced into
│    (pdf_processor.py)│  ~800-character windows with 150-char
│                      │  overlap, tagged with the page number
└─────────────────────┘
   │
   ▼
┌─────────────────────┐
│ 3. Embed             │  Each chunk's text → Gemini →
│    (embeddings.py)   │  a 768-number vector representing
│                      │  its meaning
└─────────────────────┘
   │
   ▼
┌─────────────────────┐
│ 4. Index             │  All chunk vectors go into a FAISS
│    (vector_store.py) │  index for fast similarity search
└─────────────────────┘

──────────── (document is now "ready") ────────────

Ask a question
   │
   ▼
┌─────────────────────┐
│ 5. Embed the question│  Same embedding model, different
│    (embeddings.py)   │  task_type (query vs document)
└─────────────────────┘
   │
   ▼
┌─────────────────────┐
│ 6. Search             │  FAISS returns the top-4 chunks
│    (vector_store.py)  │  whose vectors are closest to the
│                       │  question's vector
└─────────────────────┘
   │
   ▼
┌─────────────────────┐
│ 7. Generate            │  Those 4 chunks get stuffed into a
│    (rag.py)             │  prompt template and sent to
│                         │  gemini-2.5-flash, which answers
│                         │  using only that context
└─────────────────────┘
   │
   ▼
Answer + source cards (page number, similarity score, snippet)
```

## Why chunk at all?

Two reasons:

- **Precision** — if you embedded whole pages (or the whole doc), a
  question about one paragraph would retrieve the whole page, diluting
  relevance and wasting context budget.
- **Granular citation** — chunk-level retrieval is what lets the UI say
  "this answer came from page 8, specifically this sentence" instead of
  "somewhere in the document."

**Overlap** (150 of 800 characters) exists so a sentence that happens to
fall right on a chunk boundary doesn't get orphaned — it appears in both
neighboring chunks, so at least one of them retrieves it whole.

This is naive character-based chunking, not sentence- or
paragraph-aware. It's simple and good enough for prose-heavy PDFs; it can
occasionally cut mid-sentence. A cleaner (but heavier) version would use a
sentence tokenizer and chunk by sentence count instead.

## Embeddings: what "meaning as numbers" actually means

`gemini-embedding-001` takes a string and returns a vector (a list of
numbers, here truncated to 768 dimensions from the model's native 3072 via
`output_dimensionality`). The property that matters: **texts with similar
meaning produce vectors that point in similar directions**, regardless of
exact wording. "What causes deadlocks?" and "the four conditions for a
deadlock to occur" end up close together in this space even though they
share almost no words.

Two `task_type` modes are used:

- `RETRIEVAL_DOCUMENT` — when embedding the chunks going *into* the index
- `RETRIEVAL_QUERY` — when embedding the user's question

These produce slightly different vectors even for the same text, because
the model is asymmetric: a question and its answer aren't phrased the same
way, and the model is trained to account for that when you tell it which
role each side is playing.

## Why FAISS `IndexFlatIP` + manual normalization

`IndexFlatIP` does an exhaustive inner-product search — for a query
vector, it computes the dot product against every stored vector and
returns the highest ones. No approximation, no index-building step; it's
just "brute force, but in optimized C++." Perfectly fine at 81 chunks;
would need an approximate index (`IndexIVFFlat`, HNSW, etc.) at
hundreds-of-thousands-of-vectors scale.

Inner product of two vectors only equals **cosine similarity** (the
standard way to compare "meaning direction" while ignoring vector length)
if both vectors are unit-length first. So every vector — chunks and
queries alike — gets L2-normalized in `embeddings.py` right after it comes
back from Gemini. That's the `_normalize()` function: divide each vector
by its own magnitude.

## The `Chunk` dataclass — why metadata travels with the vector

```python
@dataclass
class Chunk:
    text: str
    page: int
```

FAISS itself only knows about numbers — it has no idea what a "page" is.
`VectorStore` keeps a parallel Python list (`self.chunks`) in the exact
same order as vectors were added to the index, so
`index.search()` returning "vector at position 37" can be mapped straight
back to `self.chunks[37]` to recover the original text and page number.
This positional-parallel-array trick is the simplest possible metadata
store; a production system would use FAISS's `IndexIDMap` or an external
DB instead so deletions/updates don't require rebuilding everything.

## The generation prompt (`rag.py`)

The retrieved chunks get formatted like this before being sent to the LLM:

```
[1] (page 7) a deadlock arises when four conditions hold simultaneously...
[2] (page 8) circular wait means a closed chain of processes each...
```

...followed by the system instruction (answer only from context, say so if
it's not there, don't refer to "the context" in the answer) and the
question. This numbered format is what lets the model naturally weave
information from multiple chunks without needing structured/JSON output.

**Important nuance:** the LLM is *instructed* to only use the given
context — this is a prompting convention, not a hard technical guarantee.
Nothing stops the model from ignoring the instruction and using outside
knowledge (this is exactly what "hallucination despite RAG" looks like in
production systems). For a class demo this is a non-issue; worth knowing
if asked "how do you *guarantee* it doesn't make things up?" — the honest
answer is you don't, fully; you reduce the likelihood substantially and
make it inspectable via the source citations.

## Why indexing runs in a background thread

Uploading a 37-page PDF means ~80 sequential Gemini API calls (one per
chunk — `gemini-embedding-001` embeds one string per request). That would
block a normal request-response cycle for way too long. Instead:

- `POST /upload` saves the file, spins up a `threading.Thread` to do the
  actual work, and returns immediately with a `doc_id`
- The frontend polls `GET /status/{doc_id}` every 700ms
- Progress lives in the `DOCS` in-memory dict, mutated by the background
  thread and read by the status endpoint — this works because Python
  threads share memory (no serialization needed), though it does mean this
  approach isn't safe to scale to multiple server processes without moving
  state to something shared like Redis

## Data storage — what's persistent vs. not

Nothing is persistent. `DOCS` is a plain Python dict living in the FastAPI
process's memory; restart `uvicorn` and it's gone, including the FAISS
index. The uploaded PDF file itself is saved to `backend/uploads/`, but
there's no cleanup job and no database row pointing back to it — it's
purely a scratch file `process_document()` reads once. This is a
deliberate scope cut for a demo, not an oversight; see `README.md`'s notes
section for what you'd add to make it durable.

## File-by-file map

| File | Responsibility |
|---|---|
| `backend/config.py` | Model names, chunk size/overlap, top-k — the knobs |
| `backend/pdf_processor.py` | PDF → page text → overlapping chunks |
| `backend/embeddings.py` | Text → normalized vector, via Gemini |
| `backend/vector_store.py` | FAISS wrapper + chunk metadata lookup |
| `backend/rag.py` | Prompt construction + calling the generation model |
| `backend/main.py` | FastAPI routes, background indexing thread, in-memory `DOCS` store |
| `backend/models.py` | Pydantic request/response schemas |
| `frontend/src/api.js` | Thin fetch wrapper around the three backend endpoints |
| `frontend/src/App.jsx` | Top-level state: current doc, status polling loop |
| `frontend/src/components/DocumentPanel.jsx` | Left panel: upload zone / indexed card / progress |
| `frontend/src/components/ChatPanel.jsx` | Right panel: message list, input, source cards |

## Likely viva/defense questions

- **"Why not just send the whole PDF to the LLM?"** — context window cost,
  latency, and dilution of relevance; retrieval narrows to what's actually
  relevant to *this* question.
- **"What's the difference between `RETRIEVAL_DOCUMENT` and
  `RETRIEVAL_QUERY`?"** — same embedding model, but it's trained
  asymmetrically so a question and its matching answer land close together
  in vector space even though they're phrased very differently.
- **"Why cosine similarity and not Euclidean distance?"** — cosine cares
  about *direction* (meaning) not magnitude (roughly, text length), which
  matches the intuition that a short and a long passage about the same
  topic should still be considered similar.
- **"What happens if the answer isn't in the PDF?"** — the system prompt
  explicitly instructs the model to say so rather than guess; retrieval
  will still return the top-4 *closest* chunks even if none are truly
  relevant, so this depends on the model actually following the
  instruction, not a hard cutoff.
- **"How would you scale this beyond a demo?"** — persistent storage
  (Postgres + pgvector or a dedicated vector DB) instead of the in-memory
  dict/FAISS-in-RAM combo, multi-document support, and a task queue
  (Celery/RQ) instead of a bare Python thread for indexing.
