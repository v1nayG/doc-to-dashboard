import { motion, AnimatePresence } from 'framer-motion'
import { Trash2 } from 'lucide-react'

const DOC_TYPE_CONFIG = {
  'Bank Statement':    { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.2)',  icon: '🏦' },
  'Financial Report':  { color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.2)',  icon: '📊' },
  'Invoice':           { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)',  icon: '🧾' },
  'Sales Report':      { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.2)', icon: '📈' },
  'Survey':            { color: '#f472b6', bg: 'rgba(244,114,182,0.1)', border: 'rgba(244,114,182,0.2)', icon: '📋' },
  'Research Paper':    { color: '#fb923c', bg: 'rgba(251,146,60,0.1)',  border: 'rgba(251,146,60,0.2)',  icon: '🔬' },
  'Other':             { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)', icon: '📄' },
}

const getDocConfig = (type) => DOC_TYPE_CONFIG[type] || DOC_TYPE_CONFIG['Other']

const getFileExt = (name = '') => {
  const ext = name.split('.').pop()?.toUpperCase()
  return ext || 'DOC'
}

const getExtColor = (name = '') => {
  const ext = name.split('.').pop()?.toLowerCase()
  if (ext === 'pdf')  return { color: '#ef4444', bg: 'rgba(239,68,68,0.12)' }
  if (ext === 'xlsx' || ext === 'xls') return { color: '#22c55e', bg: 'rgba(34,197,94,0.12)' }
  if (ext === 'csv')  return { color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' }
  if (ext === 'docx' || ext === 'doc') return { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' }
  return { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' }
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
            background: 'rgba(99,102,241,0.15)',
            border: '1px solid rgba(99,102,241,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
              width: 48, height: 48, borderRadius: 14,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <p style={{ fontWeight: 500, marginBottom: 4, color: 'rgba(255,255,255,0.35)' }}>No documents yet</p>
            <p style={{ color: 'rgba(255,255,255,0.18)', fontSize: '0.75rem' }}>Upload one to get started</p>
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
                        background: 'linear-gradient(to bottom, #818cf8, #6366f1)',
                        boxShadow: '0 0 8px rgba(99,102,241,0.6)',
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
                        fontSize: '0.8rem', fontWeight: 500,
                        color: isActive ? '#e8e8f0' : 'rgba(255,255,255,0.7)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        marginBottom: 3,
                        transition: 'color 0.2s',
                      }} title={doc.fileName}>
                        {doc.fileName}
                      </div>

                      <div style={{
                        fontSize: '0.7rem', color: 'rgba(255,255,255,0.28)',
                        marginBottom: docConfig ? 5 : 0,
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
                          flexShrink: 0, padding: 5, marginTop: 2,
                          borderRadius: 7, border: 'none',
                          background: 'transparent', cursor: 'pointer',
                          color: 'rgba(255,255,255,0.2)',
                          transition: 'all 0.15s',
                          display: 'flex', alignItems: 'center',
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
