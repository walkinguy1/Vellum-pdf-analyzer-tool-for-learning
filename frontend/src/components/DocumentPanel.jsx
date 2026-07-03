import UploadZone from './UploadZone.jsx'
import IndexingProgress from './IndexingProgress.jsx'

export default function DocumentPanel({ doc, status, onFileSelected, onReplace }) {
  const isReady = status?.stage === 'ready'
  const isError = status?.stage === 'error'
  const isIndexing = doc && !isReady && !isError

  return (
    <div className="panel doc-panel">
      <div className="doc-panel-title">📄 Document</div>

      {!doc && <UploadZone onFileSelected={onFileSelected} />}

      {doc && (
        <>
          <div className="doc-card">
            <div className="doc-icon">PDF</div>
            <div className="doc-meta">
              <div className="doc-name">{doc.filename}</div>
              <div className="doc-sub">
                {status?.pages ? `${status.pages} pages` : '…'}
                {status?.chunks ? ` · ${status.chunks} chunks` : ''}
              </div>
              {isReady && <div className="badge badge-ready" style={{ marginTop: 8 }}>✓ Indexed</div>}
              {isError && <div className="badge badge-error" style={{ marginTop: 8 }}>Failed</div>}
            </div>
          </div>

          {(isIndexing || isError) && <IndexingProgress status={status} />}

          <button className="replace-btn" onClick={onReplace}>
            ↻ Replace PDF
          </button>
        </>
      )}
    </div>
  )
}
