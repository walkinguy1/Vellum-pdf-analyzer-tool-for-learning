import { useEffect, useRef, useState } from 'react'
import DocumentPanel from './components/DocumentPanel.jsx'
import ChatPanel from './components/ChatPanel.jsx'
import { uploadDocument, getStatus, askQuestion } from './api.js'

export default function App() {
  const [docs, setDocs] = useState([])
  const pollRefs = useRef({})

  useEffect(() => {
    return () => {
      Object.values(pollRefs.current).forEach((intervalId) => clearInterval(intervalId))
    }
  }, [])

  async function trackDocument(file) {
    const { doc_id, filename } = await uploadDocument(file)
    setDocs((currentDocs) => [
      ...currentDocs,
      {
        docId: doc_id,
        filename,
        selected: true,
        status: { stage: 'extracting', pages: 0, chunks: 0, embedded: 0, total: 0, steps: [] },
      },
    ])

    pollRefs.current[doc_id] = setInterval(async () => {
      try {
        const s = await getStatus(doc_id)
        setDocs((currentDocs) => currentDocs.map((doc) => (doc.docId === doc_id ? { ...doc, status: s } : doc)))
        if (s.stage === 'ready' || s.stage === 'error') {
          clearInterval(pollRefs.current[doc_id])
          delete pollRefs.current[doc_id]
        }
      } catch {
        clearInterval(pollRefs.current[doc_id])
        delete pollRefs.current[doc_id]
      }
    }, 700)
  }

  async function handleFilesSelected(files) {
    for (const file of files) {
      if (!file.name.toLowerCase().endsWith('.pdf')) continue
      try {
        await trackDocument(file)
      } catch (error) {
        console.error(`Failed to upload ${file.name}`, error)
      }
    }
  }

  async function handleAsk(question) {
    const activeDocIds = docs.filter((doc) => doc.selected && doc.status?.stage === 'ready').map((doc) => doc.docId)
    return askQuestion(activeDocIds, question)
  }

  function handleToggleSelected(docId) {
    setDocs((currentDocs) => currentDocs.map((doc) => (doc.docId === docId ? { ...doc, selected: !doc.selected } : doc)))
  }

  function handleSelectAll() {
    setDocs((currentDocs) => currentDocs.map((doc) => ({ ...doc, selected: true })))
  }

  function handleClearAll() {
    Object.values(pollRefs.current).forEach((intervalId) => clearInterval(intervalId))
    pollRefs.current = {}
    setDocs([])
  }

  const selectedDocs = docs.filter((doc) => doc.selected)
  const readySelectedCount = selectedDocs.filter((doc) => doc.status?.stage === 'ready').length
  const focusLabel = selectedDocs.length
    ? `Searching ${readySelectedCount} ready file${readySelectedCount === 1 ? '' : 's'} out of ${selectedDocs.length} selected.`
    : 'Select one or more files in the sidebar to focus the assistant.'

  return (
    <div className="app">
      <header className="app-header">
        <h1>
          <span className="mark">✦</span> Vellum
        </h1>
        <p>Upload a PDF, then ask it questions. Every answer is grounded in the document, with page-level sources.</p>
      </header>

      <div className="app-body">
        <DocumentPanel
          docs={docs}
          onFilesSelected={handleFilesSelected}
          onToggleSelected={handleToggleSelected}
          onClearAll={handleClearAll}
          onSelectAll={handleSelectAll}
        />
        <ChatPanel ready={readySelectedCount > 0} onAsk={handleAsk} focusLabel={focusLabel} />
      </div>
    </div>
  )
}
