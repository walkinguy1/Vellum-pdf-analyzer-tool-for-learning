# Vellum — Ask Your Document

Upload one or more PDFs, ask questions about them, get answers grounded
strictly in the selected files with page-level source citations.

**Stack:** FastAPI + FAISS + Gemini on the backend, React + Vite on the frontend.

---

## Prerequisites

- Python 3.10+
- Node.js 18+
- A free Gemini API key

## 1. Get a Gemini API key

1. Go to **[aistudio.google.com/apikey](https://aistudio.google.com/apikey)**
2. Sign in and click **Create API key**
3. Copy it — you'll paste it into `.env` in step 2

This is free tier, no card required for the usage this app needs.

## 2. Backend setup

Open a terminal:

```bash
cd backend
python -m venv venv
```

Activate the virtual environment:

```bash
# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

> If you get a "externally managed environment" error on Linux, use
> `pip install -r requirements.txt --break-system-packages` instead.

Create your `.env` file from the template:

```bash
# Windows
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

Open `.env` in any text editor and paste your real key:

```
GEMINI_API_KEY=AIzaSy...your_actual_key_here
```

Start the backend:

```bash
uvicorn main:app --reload --port 8000
```

Leave this terminal running. Confirm it's up by visiting
`http://localhost:8000/health` — you should see `{"status":"ok"}`.

## 3. Frontend setup

Open a **second** terminal (keep the backend one running):

```bash
cd frontend
npm install
npm run dev
```

Open the URL it prints — usually `http://localhost:5173`.

## 4. Using it

1. Drop one or more PDFs in (or click "Choose files")
2. Use the sidebar checkboxes to focus the assistant on any subset of the
   uploaded files
3. Wait for indexing to finish on the selected files, then ask questions
   in the chat panel — each answer shows the file name, page(s), and
   snippet(s) it was drawn from

To remove everything and start over, click **Clear all files**.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Red "Failed" badge, error mentions API key | You edited `.env.example` instead of `.env`, or didn't restart `uvicorn` after adding the key |
| Red "Failed" badge, error mentions a model name / 404 | A model got deprecated — check `backend/config.py`, current model names are in `TECHNICAL.md` |
| Chat input stays disabled forever | Document is still indexing, or indexing failed — check the left panel |
| `npm install` fails | Make sure you're running it inside `frontend/`, not the project root |
| CORS / network errors in the browser console | Backend isn't running, or isn't on port 8000 — check the first terminal |

## Notes

- Everything is in-memory — restarting the backend clears any indexed
   documents. There's no database and no auth; this is scoped as a demo/multi
   document workspace, not a production deployment.
- See `TECHNICAL.md` for how the RAG pipeline actually works under the hood.
