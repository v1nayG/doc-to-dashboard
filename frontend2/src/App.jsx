import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import axios from 'axios'
import UploadZone from './components/UploadZone'
import Dashboard from './components/Dashboard'
import Loader from './components/Loader'
import Sidebar from './components/Sidebar'
import './index.css'

const API_BASE = 'http://localhost:5000/api'

// Simple bar-chart icon for the logo
const LogoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="9" width="3" height="6" rx="1" fill="white" />
    <rect x="6" y="5" width="3" height="10" rx="1" fill="white" opacity="0.7" />
    <rect x="11" y="1" width="3" height="14" rx="1" fill="white" opacity="0.5" />
  </svg>
)

export default function App() {
  const [dashboardData, setDashboardData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [history, setHistory] = useState([])
  const [activeId, setActiveId] = useState(null)

  useEffect(() => { fetchHistory() }, [])

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API_BASE}/history`)
      if (res.data.data) setHistory(res.data.data)
    } catch (_) {}
  }

  const handleUpload = async (file) => {
    setIsLoading(true)
    setError(null)
    setDashboardData(null)
    const formData = new FormData()
    formData.append('document', file)
    try {
      const res = await axios.post(`${API_BASE}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      })
      if (res.data.success) {
        setDashboardData(res.data.data)
        setActiveId(res.data.data._id || null)
        fetchHistory()
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Upload failed. Please try again.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectHistory = async (doc) => {
    setActiveId(doc._id || null)
    if (doc.dashboardData) {
      setDashboardData(doc.dashboardData)
    } else if (doc._id) {
      try {
        const res = await axios.get(`${API_BASE}/history/${doc._id}`)
        setDashboardData(res.data.data)
      } catch (_) {}
    }
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE}/history/${id}`)
      setHistory(prev => prev.filter(d => d._id !== id))
      if (activeId === id) { setDashboardData(null); setActiveId(null) }
    } catch (_) {}
  }

  const handleReset = () => {
    setDashboardData(null)
    setError(null)
    setActiveId(null)
  }

  return (
    <div className="app">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-logo">
          <div className="logo-mark"><LogoIcon /></div>
          DocDash
        </div>
        <div className="navbar-right">
          <span className="nav-pill">
            <span className="nav-pill-dot" />
            Powered by Gemini
          </span>
        </div>
      </nav>

      <div className="app-layout">
        <Sidebar
          history={history}
          activeId={activeId}
          onSelect={handleSelectHistory}
          onDelete={handleDelete}
        />

        <div className="content-area">
          <AnimatePresence>
            {isLoading && <Loader />}
          </AnimatePresence>

          {!dashboardData ? (
            <>
              {/* Hero */}
              <div className="hero">
                <div className="hero-eyebrow">
                  <span>AI-Powered</span>
                  <span style={{ color: 'var(--border-strong)' }}>·</span>
                  <span>Document Intelligence</span>
                </div>
                <h1>Turn documents into <em>live dashboards</em></h1>
                <p>
                  Upload a PDF, spreadsheet, or image. Gemini AI extracts
                  structured data and builds an interactive dashboard instantly.
                </p>
                <div className="hero-divider">
                  <span>5s avg. processing</span>
                  <span className="hero-divider-sep" />
                  <span>5+ file formats</span>
                  <span className="hero-divider-sep" />
                  <span>No manual work</span>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="error-banner" style={{ maxWidth: 620, margin: '0 auto 1rem' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M8 5v4M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  {error}
                </div>
              )}

              <UploadZone onUpload={handleUpload} isLoading={isLoading} />

              {/* Feature chips */}
              <div className="feature-list">
                {[
                  'OCR for scanned docs',
                  'Gemini AI analysis',
                  'Auto chart generation',
                  'Document history',
                  'Export as PNG',
                ].map((f) => (
                  <div key={f} className="feature-item">
                    <span className="feature-dot" />
                    {f}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <Dashboard data={dashboardData} onReset={handleReset} />
          )}
        </div>
      </div>
    </div>
  )
}
