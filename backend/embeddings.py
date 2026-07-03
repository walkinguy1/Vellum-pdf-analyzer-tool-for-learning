from typing import List

import numpy as np
from google import genai
from google.genai import types

from config import GEMINI_API_KEY, EMBEDDING_MODEL, EMBEDDING_DIM

_client = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=GEMINI_API_KEY)
    return _client


def _normalize(arr: np.ndarray) -> np.ndarray:
    # gemini-embedding-001 only auto-normalizes the default 3072-dim output;
    # since we truncate to EMBEDDING_DIM via output_dimensionality, we
    # normalize manually so inner-product search behaves like cosine similarity.
    norms = np.linalg.norm(arr, axis=1, keepdims=True)
    norms[norms == 0] = 1
    return arr / norms


def embed_texts(texts: List[str], task_type: str = "RETRIEVAL_DOCUMENT") -> np.ndarray:
    """Embed a list of texts with Gemini. gemini-embedding-001 returns one
    embedding per call, so we loop (keeps progress reporting simple too)."""
    vectors = []
    for text in texts:
        result = _get_client().models.embed_content(
            model=EMBEDDING_MODEL,
            contents=text,
            config=types.EmbedContentConfig(
                task_type=task_type,
                output_dimensionality=EMBEDDING_DIM,
            ),
        )
        vectors.append(result.embeddings[0].values)
    arr = np.array(vectors, dtype="float32")
    return _normalize(arr)


def embed_query(text: str) -> np.ndarray:
    return embed_texts([text], task_type="RETRIEVAL_QUERY")[0]
