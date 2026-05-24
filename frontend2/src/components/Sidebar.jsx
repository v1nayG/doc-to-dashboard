import { motion } from 'framer-motion'

export default function Sidebar({ history, activeId, onSelect, onDelete }) {
  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit',
    })
  }

  const formatSize = (bytes) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <motion.div 
      className="sidebar"
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 256, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ type: "spring", bounce: 0, duration: 0.4 }}
      style={{ whiteSpace: 'nowrap' }}
    >
      <div className="sidebar-header">
        <span className="sidebar-title">History</span>
        {history.length > 0 && (
          <span className="sidebar-count">{history.length}</span>
        )}
      </div>

      <div className="history-list">
        {history.length === 0 ? (
          <div className="sidebar-empty">
            <div className="sidebar-empty-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <p>No documents yet.</p>
            <p>Upload one to get started.</p>
          </div>
        ) : (
          history.map((doc, i) => (
            <motion.div
              key={doc._id || i}
              className={`history-item ${activeId === (doc._id || i) ? 'active' : ''}`}
              onClick={() => onSelect(doc)}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, type: 'spring', stiffness: 260, damping: 24 }}
            >
              <div className="history-name" title={doc.fileName}>{doc.fileName}</div>
              <div className="history-meta">
                {doc.createdAt && formatDate(doc.createdAt)}
                {doc.fileSize && ` · ${formatSize(doc.fileSize)}`}
              </div>
              {doc.dashboardData?.document_type && (
                <span className="history-type-tag">{doc.dashboardData.document_type}</span>
              )}
              {onDelete && doc._id && (
                <button
                  className="history-del-btn"
                  onClick={(e) => { e.stopPropagation(); onDelete(doc._id) }}
                  title="Delete"
                >
                  ✕
                </button>
              )}
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  )
}
