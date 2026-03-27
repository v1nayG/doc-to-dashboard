import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'

const UploadSVG = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
)

export default function UploadZone({ onUpload, isLoading }) {
  const [dragActive, setDragActive] = useState(false)

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) onUpload(acceptedFiles[0])
  }, [onUpload])

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
    onDropAccepted: () => setDragActive(false),
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxSize: 20 * 1024 * 1024,
    noClick: true,
    disabled: isLoading,
  })

  return (
    <div className="upload-section">
      <motion.div
        {...getRootProps()}
        className={`upload-zone ${dragActive ? 'dragging' : ''}`}
        whileHover={{ scale: 1.005 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      >
        <input {...getInputProps()} />

        <div className="upload-icon-wrap" style={{ color: dragActive ? 'var(--accent)' : 'var(--text-muted)' }}>
          <UploadSVG />
        </div>

        <h3>{dragActive ? 'Release to upload' : 'Upload your document'}</h3>
        <p>
          Drag & drop, or click the button below.<br />
          AI will generate an interactive dashboard.
        </p>

        <motion.button
          className="upload-btn"
          onClick={open}
          whileTap={{ scale: 0.97 }}
          disabled={isLoading}
        >
          {isLoading ? 'Processing…' : 'Choose file'}
        </motion.button>

        <div className="upload-formats">
          {['PDF', 'Excel', 'CSV', 'JPG', 'PNG'].map(type => (
            <span key={type} className="format-tag">{type}</span>
          ))}
        </div>
        <p className="upload-hint">Max 20 MB</p>
      </motion.div>
    </div>
  )
}
