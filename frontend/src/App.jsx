import { useEffect, useRef, useState } from 'react'
import DocumentPanel from './components/DocumentPanel.jsx'
import ChatPanel from './components/ChatPanel.jsx'
import { uploadDocument, getStatus, askQuestion } from './api.js'

export default function App() {
  const [doc, setDoc] = useState(null) // { docId, filename }
  const [status, setStatus] = useState(null)
  const pollRef = useRef(null)

  useEffect(() => {
    return () => clearInterval(pollRef.current)
  }, [])

  async function handleFileSelected(file) {
    clearInterval(pollRef.current)
    setStatus(null)

    const { doc_id, filename } = await uploadDocument(file)
    setDoc({ docId: doc_id, filename })

    pollRef.current = setInterval(async () => {
      try {
        const s = await getStatus(doc_id)
        setStatus(s)
        if (s.stage === 'ready' || s.stage === 'error') {
          clearInterval(pollRef.current)
        }
      } catch {
        clearInterval(pollRef.current)
      }
    }, 700)
  }

  function handleReplace() {
    clearInterval(pollRef.current)
    setDoc(null)
    setStatus(null)
  }

  async function handleAsk(question) {
    return askQuestion(doc.docId, question)
  }

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
          doc={doc}
          status={status}
          onFileSelected={handleFileSelected}
          onReplace={handleReplace}
        />
        <ChatPanel ready={status?.stage === 'ready'} onAsk={handleAsk} />
      </div>
    </div>
  )
}
