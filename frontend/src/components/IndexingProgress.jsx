export default function IndexingProgress({ status }) {
  const steps = status?.steps ?? []
  const doneCount = steps.filter((s) => s.state === 'done').length
  const pct = steps.length ? Math.round((doneCount / steps.length) * 100) : 0

  return (
    <div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="step-list">
        {steps.map((step, i) => (
          <div key={i} className={`step ${step.state}`}>
            <span className="step-icon">{step.state === 'done' ? '✓' : ''}</span>
            <span>{step.label}</span>
          </div>
        ))}
      </div>
      {status?.error && <div className="error-text" style={{ marginTop: 12 }}>{status.error}</div>}
    </div>
  )
}
