export default function SourceCard({ source }) {
  return (
    <div className="source-card">
      <span className="source-file">{source.filename}</span>
      <span className="source-page">p.{source.page} · {source.score.toFixed(2)}</span>
      <span className="source-snippet">"…{source.snippet}"</span>
    </div>
  )
}
