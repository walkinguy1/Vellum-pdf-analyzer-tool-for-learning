import { CheckCircle2, Circle, Loader2, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export default function IndexingProgress({ status }) {
  const steps = status?.steps ?? []
  const doneCount = steps.filter((s) => s.state === 'done').length
  const pct = steps.length ? Math.round((doneCount / steps.length) * 100) : 0

  return (
    <div className="space-y-4 p-4 bg-paper-inset/50 rounded-2xl border border-line">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold uppercase tracking-widest text-ink-soft">Indexing Progress</span>
        <span className="text-xs font-bold text-accent">{pct}%</span>
      </div>
      
      <div className="h-2 bg-paper-inset rounded-full overflow-hidden border border-line/50">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="h-full bg-accent rounded-full shadow-[0_0_8px_rgba(181,98,47,0.4)]" 
        />
      </div>

      <div className="space-y-2.5">
        {steps.map((step, i) => {
          const isDone = step.state === 'done'
          const isActive = step.state === 'active'
          const isPending = step.state === 'pending'
          const isError = step.state === 'error'

          return (
            <div key={i} className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {isDone && <CheckCircle2 size={16} className="text-sage" />}
                {isActive && <Loader2 size={16} className="text-accent animate-spin" />}
                {isPending && <Circle size={16} className="text-ink-faint" />}
                {isError && <AlertCircle size={16} className="text-danger" />}
              </div>
              <span className={cn(
                "text-sm transition-colors duration-200",
                isDone ? "text-ink font-medium" : 
                isActive ? "text-accent font-semibold" : 
                "text-ink-faint"
              )}>
                {step.label}
              </span>
            </div>
          )
        })}
      </div>

      {status?.error && (
        <motion.div 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 p-3 bg-danger/10 border border-danger/20 rounded-xl mt-2"
        >
          <AlertCircle size={14} className="text-danger mt-0.5 flex-shrink-0" />
          <p className="text-xs text-danger font-medium leading-relaxed">{status.error}</p>
        </motion.div>
      )}
    </div>
  )
}
