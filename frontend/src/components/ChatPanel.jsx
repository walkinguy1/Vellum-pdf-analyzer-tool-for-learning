import { useEffect, useRef, useState } from 'react'
import SourceCard from './SourceCard.jsx'

export default function ChatPanel({ ready, onAsk }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [asking, setAsking] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, asking])

  async function handleSend() {
    const question = input.trim()
    if (!question || asking || !ready) return

    setMessages((m) => [...m, { role: 'user', text: question }])
    setInput('')
    setAsking(true)

    try {
      const res = await onAsk(question)
      setMessages((m) => [...m, { role: 'assistant', text: res.answer, sources: res.sources }])
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', text: `Something went wrong: ${err.message}`, sources: [] }])
    } finally {
      setAsking(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="panel chat-panel">
      <div className="chat-header">
        <h2 className="serif">Ask about your document</h2>
        <p>Answers come only from the PDF you uploaded</p>
      </div>

      <div className="chat-messages" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">✎</div>
            <h3 className="serif">Nothing asked yet</h3>
            <p>{ready ? 'Try asking a question about the document below.' : 'Upload and index a PDF to start asking questions.'}</p>
          </div>
        )}

        {messages.map((m, i) =>
          m.role === 'user' ? (
            <div className="msg-row user" key={i}>
              <div className="bubble user">{m.text}</div>
            </div>
          ) : (
            <div className="msg-row assistant" key={i}>
              <div className="answer-block">
                <div className="bubble assistant">{m.text}</div>
                {m.sources?.length > 0 && (
                  <>
                    <div className="sources-label">❝ Sources</div>
                    <div className="sources-list">
                      {m.sources.map((s, j) => (
                        <SourceCard source={s} key={j} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )
        )}

        {asking && (
          <div className="msg-row assistant">
            <div className="bubble assistant thinking">Reading the document…</div>
          </div>
        )}
      </div>

      <div className="chat-input-row">
        <input
          className="chat-input"
          placeholder={ready ? 'Ask a question about the document…' : 'Waiting for document to finish indexing…'}
          value={input}
          disabled={!ready || asking}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="send-btn" onClick={handleSend} disabled={!ready || asking || !input.trim()}>
          ↑
        </button>
      </div>
    </div>
  )
}
