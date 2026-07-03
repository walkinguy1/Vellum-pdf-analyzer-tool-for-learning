import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

EMBEDDING_MODEL = "gemini-embedding-001"
EMBEDDING_DIM = 768   # recommended MRL truncation; also the FAISS index dim
GENERATION_MODEL = "gemini-2.5-flash"

CHUNK_SIZE = 800       # characters per chunk
CHUNK_OVERLAP = 150    # character overlap between chunks
EMBED_BATCH_SIZE = 8   # chunks embedded per progress tick
TOP_K = 4              # chunks retrieved per question

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
