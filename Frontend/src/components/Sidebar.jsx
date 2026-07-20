import { motion, AnimatePresence } from 'framer-motion'
import { Trash2 } from 'lucide-react'

const DOC_TYPE_CONFIG = {
  'Bank Statement':    { color: 'var(--text-primary)', bg: 'var(--bg-hover)',  border: 'var(--border-strong)',  icon: '🏦' },
  'Financial Report':  { color: 'var(--text-primary)', bg: 'var(--bg-hover)',  border: 'var(--border-strong)',  icon: '📊' },
  'Invoice':           { color: 'var(--text-primary)', bg: 'var(--bg-hover)',  border: 'var(--border-strong)',  icon: '🧾' },
  'Sales Report':      { color: 'var(--text-primary)', bg: 'var(--bg-hover)',  border: 'var(--border-strong)',  icon: '📈' },
  'Survey':            { color: 'var(--text-primary)', bg: 'var(--bg-hover)',  border: 'var(--border-strong)',  icon: '📋' },
  'Research Paper':    { color: 'var(--text-primary)', bg: 'var(--bg-hover)',  border: 'var(--border-strong)',  icon: '🔬' },
  'Other':             { color: 'var(--text-secondary)', bg: 'var(--bg-surface)', border: 'var(--border)', icon: '📄' },
}

const getDocConfig = (type) => DOC_TYPE_CONFIG[type] || DOC_TYPE_CONFIG['Other']

const getFileExt = (name = '') => {
  const ext = name.split('.').pop()?.toUpperCase()
  return ext || 'DOC'
}

const getExtColor = (name = '') => {
  const ext = name.split('.').pop()?.toLowerCase()
  if (['pdf', 'xlsx', 'xls', 'csv', 'docx', 'doc'].includes(ext)) {
    return { color: 'var(--text-primary)', bg: 'var(--bg-hover)' }
  }
  return { color: 'var(--text-secondary)', bg: 'var(--bg-surface)' }
}

const formatDate = (dateStr) => {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now - d
  if (diff < 60000)       return 'Just now'
  if (diff < 3600000)     return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000)    return `${Math.floor(diff / 3600000)}h ago`
  if (diff < 172800000)   return 'Yesterday'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default function Sidebar({ history, activeId, onSelect, onDelete }) {
  return (
    <motion.div
      className="sidebar"
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 260, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
      style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}
    >
      {/* Header */}
      <div className="sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'var(--bg-hover)',
            border: '1px solid var(--border-strong)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/>
            </svg>
          </div>
          <span className="sidebar-title">History</span>
        </div>
        {history.length > 0 && (
          <span className="sidebar-count">{history.length}</span>
        )}
      </div>

      {/* List */}
      <div className="history-list">
        {history.length === 0 ? (
          <div className="sidebar-empty">
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 12
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>
              </svg>
            </div>
            <p style={{ fontWeight: 500, marginBottom: 4, color: 'var(--text-muted)' }}>No documents yet</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Upload one to get started</p>
          </div>
        ) : (
          <AnimatePresence>
            {history.map((doc, i) => {
              const isActive = activeId === (doc._id?.toString() || i)
              const extStyle = getExtColor(doc.fileName)
              const docType = doc.dashboardData?.document_type
              const docConfig = docType ? getDocConfig(docType) : null

              return (
                <motion.div
                  key={doc._id || i}
                  className={`history-item ${isActive ? 'active' : ''}`}
                  onClick={() => onSelect(doc)}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ delay: i * 0.04, type: 'spring', stiffness: 280, damping: 26 }}
                  style={{ padding: '0.7rem 1rem', position: 'relative', cursor: 'pointer' }}
                >
                  {/* Active left bar */}
                  {isActive && (
                    <motion.div
                      layoutId="activeBar"
                      style={{
                        position: 'absolute', left: 0, top: '20%', bottom: '20%',
                        width: 3, borderRadius: 4,
                        background: 'var(--accent)',
                        boxShadow: '0 0 8px var(--accent-dim)',
                      }}
                    />
                  )}

                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    {/* File type badge */}
                    <div style={{
                      flexShrink: 0,
                      width: 36, height: 36,
                      borderRadius: 10,
                      background: extStyle.bg,
                      border: `1px solid ${extStyle.color}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.6rem', fontWeight: 800,
                      color: extStyle.color,
                      letterSpacing: '0.02em',
                      marginTop: 1,
                    }}>
                      {getFileExt(doc.fileName)}
                    </div>

                    {/* Text content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: 500, fontSize: '0.85rem',
                        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        marginBottom: 3,
                        transition: 'color 0.2s',
                      }} title={doc.fileName}>
                        {doc.fileName}
                      </div>

                      <div style={{
                        fontSize: '0.7rem', color: 'var(--text-muted)',
                        marginTop: 4, display: 'flex', alignItems: 'center', gap: 4
                      }}>
                        {doc.createdAt && formatDate(doc.createdAt)}
                      </div>

                      {/* Document type pill */}
                      {docConfig && (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          fontSize: '0.62rem', fontWeight: 600,
                          color: docConfig.color,
                          background: docConfig.bg,
                          border: `1px solid ${docConfig.border}`,
                          borderRadius: 999, padding: '2px 7px',
                          letterSpacing: '0.02em',
                        }}>
                          <span style={{ fontSize: '0.7rem' }}>{docConfig.icon}</span>
                          {docType}
                        </span>
                      )}
                    </div>

                    {/* Delete btn */}
                    {onDelete && doc._id && (
                      <button
                        className="history-del-btn"
                        onClick={(e) => { e.stopPropagation(); onDelete(doc._id) }}
                        title="Delete"
                        style={{
                          flexShrink: 0, border: 'none',
                          background: 'transparent',
                          color: 'var(--text-muted)', cursor: 'pointer',
                          padding: 4, borderRadius: 4,
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  )
}
