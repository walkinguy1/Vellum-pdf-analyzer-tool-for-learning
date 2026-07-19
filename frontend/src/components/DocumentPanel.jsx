import UploadZone from './UploadZone.jsx'
import IndexingProgress from './IndexingProgress.jsx'
import { Files, Trash2, CheckCircle2, AlertCircle, Loader2, FileText, CheckSquare } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export default function DocumentPanel({ docs, onFilesSelected, onToggleSelected, onClearAll, onSelectAll }) {
  const selectedCount = docs.filter((doc) => doc.selected).length
  const readyCount = docs.filter((doc) => doc.selected && doc.status?.stage === 'ready').length
  const activeStatus = docs.find((doc) => doc.selected && doc.status && doc.status.stage !== 'ready' && doc.status.stage !== 'error')?.status
  
  return (
    <div className="glass-panel p-6 flex flex-col gap-6 h-fit sticky top-6">
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div className="flex items-center gap-2 text-ink font-semibold serif text-xl">
          <Files className="text-accent" size={20} />
          <span>Library</span>
        </div>
        {docs.length > 0 && (
          <div className="flex gap-2">
            <button 
              onClick={onSelectAll}
              className="p-2 hover:bg-paper-inset rounded-lg transition-colors text-ink-soft hover:text-accent"
              title="Select All"
            >
              <CheckSquare size={18} />
            </button>
            <button 
              onClick={onClearAll}
              className="p-2 hover:bg-danger/10 rounded-lg transition-colors text-ink-soft hover:text-danger"
              title="Clear All"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>

      <UploadZone onFilesSelected={onFilesSelected} />

      {docs.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-end px-1">
            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-widest text-ink-faint">Stats</h4>
              <div className="text-sm font-medium text-ink-soft">
                {selectedCount} / {docs.length} selected
              </div>
            </div>
            <div className="text-xs font-semibold px-2 py-1 bg-sage-soft text-sage rounded-md">
              {readyCount} Indexed
            </div>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            <AnimatePresence initial={false}>
              {docs.map((doc) => {
                const isReady = doc.status?.stage === 'ready'
                const isError = doc.status?.stage === 'error'
                const isIndexing = !isReady && !isError

                return (
                  <motion.div
                    key={doc.docId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={cn(
                      "group relative flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 cursor-pointer",
                      doc.selected 
                        ? "bg-paper-raised border-accent shadow-sm" 
                        : "bg-paper-inset/30 border-line hover:border-accent-soft hover:bg-paper-inset/50"
                    )}
                    onClick={() => onToggleSelected(doc.docId)}
                  >
                    <div className="mt-1">
                      <div className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                        doc.selected ? "bg-accent border-accent text-white" : "bg-white border-line group-hover:border-accent-soft"
                      )}>
                        {doc.selected && <CheckSquare size={12} strokeWidth={3} />}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText size={14} className={doc.selected ? "text-accent" : "text-ink-faint"} />
                        <span className="text-sm font-semibold text-ink truncate">
                          {doc.filename}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-ink-faint font-medium uppercase tracking-tighter">
                          {doc.status?.pages ? `${doc.status.pages} pages` : 'Analyzing...'}
                        </span>
                        
                        <div className="flex items-center gap-1">
                          {isReady && <CheckCircle2 size={12} className="text-sage" />}
                          {isError && <AlertCircle size={12} className="text-danger" />}
                          {isIndexing && <Loader2 size={12} className="text-accent animate-spin" />}
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-wider",
                            isReady ? "text-sage" : isError ? "text-danger" : "text-accent"
                          )}>
                            {isReady ? "Ready" : isError ? "Error" : "Indexing"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {activeStatus && (
        <div className="mt-2">
          <IndexingProgress status={activeStatus} />
        </div>
      )}
    </div>
  )
}
