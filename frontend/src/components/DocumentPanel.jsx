import UploadZone from './UploadZone.jsx'
import IndexingProgress from './IndexingProgress.jsx'

export default function DocumentPanel({ docs, onFilesSelected, onToggleSelected, onClearAll, onSelectAll }) {
  const selectedCount = docs.filter((doc) => doc.selected).length
  const readyCount = docs.filter((doc) => doc.selected && doc.status?.stage === 'ready').length
  const activeStatus = docs.find((doc) => doc.selected && doc.status && doc.status.stage !== 'ready' && doc.status.stage !== 'error')?.status

  return (
    <div className="panel doc-panel">
      <div className="doc-panel-title">📄 Documents</div>

      <UploadZone onFilesSelected={onFilesSelected} />

      {docs.length > 0 && (
        <div className="doc-summary">
          <span>{docs.length} file{docs.length === 1 ? '' : 's'} loaded</span>
          <span>{selectedCount} selected · {readyCount} ready</span>
        </div>
      )}

      {docs.length > 0 && (
        <div className="doc-actions">
          <button className="doc-action-btn" onClick={onSelectAll}>Select all</button>
          <button className="doc-action-btn" onClick={onClearAll}>Clear all</button>
        </div>
      )}

      {docs.length > 0 && (
        <div className="doc-list">
          {docs.map((doc) => {
            const isReady = doc.status?.stage === 'ready'
            const isError = doc.status?.stage === 'error'

            return (
              <label className="doc-row" key={doc.docId}>
                <input
                  type="checkbox"
                  checked={doc.selected}
                  onChange={() => onToggleSelected(doc.docId)}
                />
                <div className="doc-card doc-card-compact">
                  <div className="doc-icon">PDF</div>
                  <div className="doc-meta">
                    <div className="doc-name">{doc.filename}</div>
                    <div className="doc-sub">
                      {doc.status?.pages ? `${doc.status.pages} pages` : '…'}
                      {doc.status?.chunks ? ` · ${doc.status.chunks} chunks` : ''}
                    </div>
                    <div className="doc-badges">
                      {isReady && <div className="badge badge-ready">✓ Indexed</div>}
                      {isError && <div className="badge badge-error">Failed</div>}
                      {!isReady && !isError && <div className="badge badge-loading">Indexing</div>}
                    </div>
                  </div>
                </div>
              </label>
            )
          })}
        </div>
      )}

      {activeStatus && <IndexingProgress status={activeStatus} />}

      {docs.length > 0 && (
        <button className="replace-btn" onClick={onClearAll}>
          ↻ Clear all files
        </button>
      )}
    </div>
  )
}
