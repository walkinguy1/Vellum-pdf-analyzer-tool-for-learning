import { useEffect, useRef, useState } from 'react'
import SourceCard from './SourceCard.jsx'
import { Send, Sparkles, MessageSquare, BookOpen, User, Bot, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export default function ChatPanel({ ready, onAsk, focusLabel }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [asking, setAsking] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }
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
    <div className="glass-panel flex flex-col h-[calc(100vh-160px)] min-h-[500px] overflow-hidden">
      <div className="px-6 py-4 border-b border-line bg-paper-raised/50 backdrop-blur-sm flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="serif text-xl font-semibold text-ink flex items-center gap-2">
            <Sparkles size={18} className="text-accent" />
            Vellum Assistant
          </h2>
          <p className="text-xs text-ink-faint font-medium mt-0.5">{focusLabel}</p>
        </div>
        <div className={cn(
          "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5",
          ready ? "bg-sage-soft text-sage" : "bg-paper-inset text-ink-faint"
        )}>
          <div className={cn("w-1.5 h-1.5 rounded-full", ready ? "bg-sage animate-pulse" : "bg-ink-faint")} />
          {ready ? "Connected" : "Waiting"}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth" ref={scrollRef}>
        <AnimatePresence>
          {messages.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-4"
            >
              <div className="w-16 h-16 bg-paper-inset rounded-2xl flex items-center justify-center text-ink-faint">
                <MessageSquare size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="serif text-xl font-medium text-ink">Ready to explore?</h3>
                <p className="text-sm text-ink-soft leading-relaxed">
                  {ready 
                    ? 'Ask anything about your selected documents. I will search through them and provide answers with direct citations.' 
                    : 'Upload and index your PDF documents in the library to start a conversation.'}
                </p>
              </div>
            </motion.div>
          )}

          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-4",
                m.role === 'user' ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 shadow-sm",
                m.role === 'user' ? "bg-accent text-white" : "bg-paper-inset text-ink-soft border border-line"
              )}>
                {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              
              <div className={cn(
                "flex flex-col max-w-[85%] space-y-2",
                m.role === 'user' ? "items-end" : "items-start"
              )}>
                <div className={cn(
                  "px-4 py-3 rounded-2xl text-[15px] leading-relaxed shadow-sm",
                  m.role === 'user' 
                    ? "bg-accent text-white rounded-tr-none" 
                    : "bg-paper-raised border border-line text-ink rounded-tl-none"
                )}>
                  {m.text}
                </div>
                
                {m.sources?.length > 0 && (
                  <div className="w-full space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-ink-faint px-1">
                      <BookOpen size={12} />
                      <span>Citations</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {m.sources.map((s, j) => (
                        <SourceCard source={s} key={j} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {asking && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4"
            >
              <div className="w-8 h-8 rounded-lg bg-paper-inset text-accent flex items-center justify-center flex-shrink-0 mt-1 border border-line">
                <Loader2 size={16} className="animate-spin" />
              </div>
              <div className="bg-paper-raised border border-line px-4 py-3 rounded-2xl rounded-tl-none shadow-sm">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-accent/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-accent/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-accent/40 rounded-full animate-bounce" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-6 bg-paper-raised/30 backdrop-blur-md border-t border-line">
        <div className="relative group">
          <textarea
            className={cn(
              "w-full bg-paper-raised border-2 border-line rounded-2xl pl-4 pr-14 py-3 text-[15px] transition-all duration-300 resize-none focus:outline-none focus:border-accent min-h-[56px] max-h-32",
              (!ready || asking) && "opacity-50 cursor-not-allowed"
            )}
            placeholder={ready ? 'Ask a question about your documents...' : 'Select documents to start chatting...'}
            value={input}
            disabled={!ready || asking}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button 
            className={cn(
              "absolute right-2 top-2 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200",
              input.trim() && ready && !asking 
                ? "bg-accent text-white shadow-lg shadow-accent/20 hover:scale-105 active:scale-95" 
                : "bg-paper-inset text-ink-faint"
            )}
            onClick={handleSend} 
            disabled={!ready || asking || !input.trim()}
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-[10px] text-center text-ink-faint mt-3 font-medium uppercase tracking-wider">
          Answers are grounded in your selected documents
        </p>
      </div>
    </div>
  )
}
