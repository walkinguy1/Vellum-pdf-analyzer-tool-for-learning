import { useEffect, useRef, useState } from 'react'
import DocumentPanel from './components/DocumentPanel.jsx'
import ChatPanel from './components/ChatPanel.jsx'
import { uploadDocument, getStatus, askQuestion } from './api.js'
import { Sparkles, Github, BookOpen, Layers } from 'lucide-react'
import { motion } from 'framer-motion'

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
    ? `Analyzing ${readySelectedCount} ready file${readySelectedCount === 1 ? '' : 's'} from ${selectedDocs.length} selected.`
    : 'Select documents in the library to focus the analysis.'

  return (
    <div className="min-h-screen bg-paper flex flex-col font-sans">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-paper/80 backdrop-blur-md border-b border-line px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20">
              <Layers className="text-white" size={24} />
            </div>
            <div>
              <h1 className="serif text-2xl font-bold text-ink leading-none">Vellum</h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent mt-1">PDF Analyzer</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <nav className="flex items-center gap-4">
              <a href="#" className="text-sm font-semibold text-ink hover:text-accent transition-colors">Explorer</a>
              <a href="#" className="text-sm font-semibold text-ink-soft hover:text-accent transition-colors">Collections</a>
            </nav>
            <div className="h-4 w-px bg-line" />
            <a 
              href="https://github.com/walkinguy1/Vellum-pdf-analyzer-tool-for-learning" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-ink-soft hover:text-ink transition-colors"
            >
              <Github size={20} />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar */}
          <motion.aside 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-4 xl:col-span-3"
          >
            <DocumentPanel
              docs={docs}
              onFilesSelected={handleFilesSelected}
              onToggleSelected={handleToggleSelected}
              onClearAll={handleClearAll}
              onSelectAll={handleSelectAll}
            />
          </motion.aside>

          {/* Chat Interface */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-8 xl:col-span-9"
          >
            <div className="flex flex-col gap-6">
              <div className="bg-accent-soft/30 border border-accent/10 rounded-2xl p-6 flex items-start gap-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                  <BookOpen className="text-accent" size={24} />
                </div>
                <div>
                  <h2 className="serif text-xl font-semibold text-ink">Document-Grounded Intelligence</h2>
                  <p className="text-sm text-ink-soft mt-1 leading-relaxed">
                    Vellum uses Retrieval-Augmented Generation (RAG) to ensure every answer is backed by your documents. 
                    Upload your PDFs, and I'll help you find exactly what you're looking for with page-level citations.
                  </p>
                </div>
              </div>
              
              <ChatPanel 
                ready={readySelectedCount > 0} 
                onAsk={handleAsk} 
                focusLabel={focusLabel} 
              />
            </div>
          </motion.section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-line py-6 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs font-medium text-ink-faint uppercase tracking-wider">
            &copy; 2026 Vellum PDF Analyzer &middot; Built for learning
          </p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-sage uppercase tracking-widest">
              <div className="w-1.5 h-1.5 bg-sage rounded-full" />
              System Online
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
