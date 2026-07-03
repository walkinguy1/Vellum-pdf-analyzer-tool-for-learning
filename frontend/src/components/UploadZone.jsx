import { useRef, useState } from 'react'

export default function UploadZone({ onFileSelected }) {
  const inputRef = useRef(null)
  const [dragActive, setDragActive] = useState(false)

  function handleDrop(e) {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) onFileSelected(file)
  }

  function handleChange(e) {
    const file = e.target.files?.[0]
    if (file) onFileSelected(file)
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
      <h3>Upload a PDF to get started</h3>
      <p>Drop a document here and ask questions about it. Answers are drawn only from the file you provide.</p>
      <button className="upload-btn" onClick={() => inputRef.current?.click()}>
        Choose file
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        hidden
        onChange={handleChange}
      />
      <p className="upload-hint">PDF up to 20MB · single document</p>
    </div>
  )
}
