const BASE = '/api'

export async function uploadDocument(file) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE}/upload`, { method: 'POST', body: form })
  if (!res.ok) throw new Error('Upload failed')
  return res.json()
}

export async function getStatus(docId) {
  const res = await fetch(`${BASE}/status/${docId}`)
  if (!res.ok) throw new Error('Could not fetch document status')
  return res.json()
}

export async function askQuestion(docIds, question) {
  const res = await fetch(`${BASE}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ doc_id: docIds[0] ?? '', doc_ids: docIds, question }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Question failed')
  }
  return res.json()
}
