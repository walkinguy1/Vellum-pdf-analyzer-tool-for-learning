from typing import List, Tuple

import faiss
import numpy as np

from pdf_processor import Chunk


class VectorStore:
    """Thin wrapper around a FAISS flat inner-product index, paired with
    the chunk metadata each vector corresponds to."""

    def __init__(self, dim: int):
        self.index = faiss.IndexFlatIP(dim)
        self.chunks: List[Chunk] = []

    def add(self, vectors: np.ndarray, chunks: List[Chunk]) -> None:
        if vectors.shape[0] == 0:
            return
        self.index.add(vectors)
        self.chunks.extend(chunks)

    def search(self, query_vec: np.ndarray, k: int) -> List[Tuple[Chunk, float]]:
        if len(self.chunks) == 0:
            return []
        query_vec = query_vec.reshape(1, -1).astype("float32")
        k = min(k, len(self.chunks))
        scores, idxs = self.index.search(query_vec, k)

        results = []
        for score, idx in zip(scores[0], idxs[0]):
            if idx == -1:
                continue
            results.append((self.chunks[idx], float(score)))
        return results
