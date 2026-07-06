import { useRef, useState } from 'react'

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
    <div
      className={`upload-zone${dragActive ? ' drag-active' : ''}`}
      onDragOver={(e) => {
        e.preventDefault()
        setDragActive(true)
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
    >
      <div className="upload-icon">⇧</div>
      <h3>Upload one or more PDFs</h3>
      <p>Drop files here or choose them from disk. Keep adding more, then use the sidebar to focus the assistant on any subset.</p>
      <button className="upload-btn" onClick={() => inputRef.current?.click()}>
        Choose files
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        multiple
        hidden
        onChange={handleChange}
      />
      <p className="upload-hint">PDF up to 20MB each · multiple documents supported</p>
    </div>
  )
}
