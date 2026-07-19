import { FileText, ExternalLink } from 'lucide-react'

export default function SourceCard({ source }) {
  return (
    <div className="group bg-paper-raised border border-line p-3 rounded-xl hover:border-accent-soft hover:shadow-sm transition-all duration-200 cursor-help">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <FileText size={12} className="text-accent flex-shrink-0" />
          <span className="text-[11px] font-bold text-ink truncate uppercase tracking-tight">
            {source.filename}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-paper-inset text-ink-soft rounded uppercase">
            Page {source.page}
          </span>
          <span className="text-[10px] font-bold text-sage">
            {Math.round(source.score * 100)}%
          </span>
        </div>
      </div>
      
      <div className="relative">
        <p className="text-[12px] text-ink-soft leading-relaxed line-clamp-3 italic">
          "{source.snippet}"
        </p>
        <div className="absolute inset-0 bg-gradient-to-t from-paper-raised/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-center pb-1">
          <ExternalLink size={12} className="text-accent" />
        </div>
      </div>
    </div>
  )
}
