import { useRef, useState } from 'react'
import { Upload, FileText, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export default function UploadZone({ onFilesSelected }) {
  const inputRef = useRef(null)
  const [dragActive, setDragActive] = useState(false)

  function handleDrop(e) {
    e.preventDefault()
    setDragActive(false)
    const files = Array.from(e.dataTransfer.files ?? [])
    if (files.length) onFilesSelected(files)
  }

  function handleChange(e) {
    const files = Array.from(e.target.files ?? [])
    if (files.length) onFilesSelected(files)
    e.target.value = ''
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative group border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300",
        dragActive 
          ? "border-accent bg-accent-soft/30 scale-[1.02]" 
          : "border-line bg-paper-inset/50 hover:border-accent-soft hover:bg-paper-inset"
      )}
      onDragOver={(e) => {
        e.preventDefault()
        setDragActive(true)
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center gap-4">
        <div className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110",
          dragActive ? "bg-accent text-white" : "bg-accent-soft text-accent-ink"
        )}>
          <Upload size={24} />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-ink">Analyze Documents</h3>
          <p className="text-sm text-ink-soft max-w-xs mx-auto">
            Drop your PDF files here or click to browse. You can analyze multiple documents simultaneously.
          </p>
        </div>

        <button 
          className="btn-primary flex items-center gap-2 shadow-lg shadow-accent/20"
          onClick={() => inputRef.current?.click()}
        >
          <Plus size={18} />
          <span>Select Files</span>
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple
          className="hidden"
          onChange={handleChange}
        />
        
        <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-ink-faint mt-2">
          <FileText size={12} />
          <span>PDF up to 20MB · Multiple Support</span>
        </div>
      </div>
    </motion.div>
  )
}
