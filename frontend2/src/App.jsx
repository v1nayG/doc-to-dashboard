import { useState, useEffect, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import UploadZone from './components/UploadZone'
import Dashboard from './components/Dashboard'
import Loader from './components/Loader'
import Sidebar from './components/Sidebar'
import AuthPage from './pages/AuthPage'
import LandingPage from './pages/LandingPage'
import AuthContext from './context/AuthContext'
import './index.css'

const API_BASE = 'http://localhost:5000/api'

const LogoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="9" width="3" height="6" rx="1" fill="white" />
    <rect x="6" y="5" width="3" height="10" rx="1" fill="white" opacity="0.7" />
    <rect x="11" y="1" width="3" height="14" rx="1" fill="white" opacity="0.5" />
  </svg>
)

// Page enum
const PAGE = {
  LANDING: 'landing',
  AUTH: 'auth',
  APP: 'app',
}

export default function App() {
  const { user, loading: authLoading, logout } = useContext(AuthContext)
  const [dashboardData, setDashboardData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [history, setHistory] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [page, setPage] = useState(PAGE.LANDING)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(t => t === 'light' ? 'dark' : 'light')
  }

  // Once auth resolves: if user is logged in, go straight to app
  useEffect(() => {
    if (!authLoading && user) {
      setPage(PAGE.APP)
    }
  }, [authLoading, user])

  useEffect(() => {
    if (user) fetchHistory()
  }, [user])

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
    setIsLoading(true)
    setError(null)
    try {
      const res = await axios.get(`${API_BASE}/history/${doc._id}`)
      setDashboardData(res.data.data)
    } catch (err) {
      console.error(err)
      setError("Failed to load full document data.")
    } finally {
      setIsLoading(false)
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

  const handleLogout = () => {
    logout()
    setDashboardData(null)
    setHistory([])
    setActiveId(null)
    setPage(PAGE.LANDING)
  }

  // Auth loading spinner
  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Loader />
      </div>
    )
  }

  // ── Landing Page ────────────────────────────
  if (page === PAGE.LANDING) {
    return (
      <LandingPage
        onGetStarted={() => {
          if (user) {
            setPage(PAGE.APP)
          } else {
            setPage(PAGE.AUTH)
          }
        }}
      />
    )
  }

  // ── Auth Page ───────────────────────────────
  if (page === PAGE.AUTH || (!user && page !== PAGE.LANDING)) {
    return (
      <AuthPage
        onSuccess={() => setPage(PAGE.APP)}
        onBack={() => setPage(PAGE.LANDING)}
      />
    )
  }

  // ── Main App ────────────────────────────────
  return (
    <div className="app">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-logo">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="btn btn-ghost" 
            style={{ padding: '6px', marginRight: '8px', border: 'none' }}
            title="Toggle Sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <div className="logo-mark"><LogoIcon /></div>
          DocDash
        </div>
        <div className="navbar-right">
          <button onClick={toggleTheme} className="btn btn-ghost" style={{ padding: '4px 8px', border: 'none' }} title="Toggle Theme">
            {theme === 'light' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
            )}
          </button>
          <span className="nav-pill">
            <span className="nav-pill-dot" />
            Powered by Gemini
          </span>
          <span className="nav-user-pill">
            {user?.username || user?.email?.split('@')[0] || 'User'}
          </span>
          <button onClick={handleLogout} className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: '0.72rem' }}>
            Logout
          </button>
        </div>
      </nav>

      <div className="app-layout">
        <AnimatePresence initial={false}>
          {isSidebarOpen && (
            <Sidebar
              history={history}
              activeId={activeId}
              onSelect={handleSelectHistory}
              onDelete={handleDelete}
            />
          )}
        </AnimatePresence>

        <div className="content-area">
          <AnimatePresence>
            {isLoading && <Loader />}
          </AnimatePresence>

          {!dashboardData ? (
            <>
              {/* Hero */}
              <div className="landing-hero" style={{ minHeight: 'auto', padding: '40px 2rem 60px', background: 'transparent' }}>
                <div className="hero-blob hero-blob-1" style={{ top: '-100px', right: '-50px', width: '400px', height: '400px' }} />
                <div className="hero-blob hero-blob-2" style={{ bottom: '-50px', left: '-50px', width: '300px', height: '300px' }} />

                <motion.div className="hero-content" style={{ margin: '0 auto' }}>
                  <motion.div className="hero-badge" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                    <span className="hero-badge-dot" />
                    AI-Powered · Document Intelligence
                  </motion.div>

                  <motion.h1 className="hero-title" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginBottom: '1rem' }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.8 }}>
                    Turn documents into <br />
                    <span className="hero-title-accent">live dashboards</span>
                  </motion.h1>

                  <motion.p className="hero-desc" style={{ marginBottom: '2rem' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7 }}>
                    Upload a PDF, spreadsheet, or image. Gemini AI extracts
                    structured data and builds an interactive dashboard instantly.
                  </motion.p>
                </motion.div>
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
