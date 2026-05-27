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

  // Navigate with browser history support
  const navigate = (nextPage) => {
    // always unlock scroll when leaving auth page
    document.body.style.overflow = ''
    window.scrollTo(0, 0)
    window.history.pushState({ page: nextPage }, '', window.location.pathname)
    setPage(nextPage)
  }

  // Handle browser back/forward buttons
  useEffect(() => {
    // Seed the initial history state so back works from any page
    window.history.replaceState({ page: PAGE.LANDING }, '', window.location.pathname)

    const onPop = (e) => {
      const target = e.state?.page || PAGE.LANDING
      document.body.style.overflow = ''
      window.scrollTo(0, 0)
      setPage(target)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // Once auth resolves: if user is logged in, go straight to app
  useEffect(() => {
    if (!authLoading && user) {
      navigate(PAGE.APP)
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
    navigate(PAGE.LANDING)
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
            navigate(PAGE.APP)
          } else {
            navigate(PAGE.AUTH)
          }
        }}
      />
    )
  }

  // ── Auth Page ───────────────────────────────
  if (page === PAGE.AUTH || (!user && page !== PAGE.LANDING)) {
    return (
      <AuthPage
        onSuccess={() => navigate(PAGE.APP)}
        onBack={() => navigate(PAGE.LANDING)}
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
              {/* Upload Hero */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                padding: '48px 2rem 32px',
                fontFamily: "'Inter', sans-serif",
              }}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    background: 'rgba(176,64,144,0.1)',
                    border: '1px solid rgba(176,64,144,0.25)',
                    color: '#c8a0e0',
                    padding: '5px 16px', borderRadius: 999,
                    fontSize: '0.78rem', fontWeight: 600,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    marginBottom: '1.5rem',
                  }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#c8a0e0', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                  AI-Powered · Document Intelligence
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.7 }}
                  style={{
                    fontSize: 'clamp(2rem, 5vw, 3.2rem)',
                    fontWeight: 300,
                    lineHeight: 1.1,
                    letterSpacing: '-0.03em',
                    color: '#f0f0f5',
                    marginBottom: '1rem',
                  }}
                >
                  Turn documents into{' '}
                  <strong style={{
                    fontWeight: 400, display: 'block',
                    background: 'linear-gradient(to right, #ffffff, #c8a0e0)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  }}>
                    live dashboards
                  </strong>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)', maxWidth: 440, lineHeight: 1.7, marginBottom: '2rem' }}
                >
                  Upload a PDF, spreadsheet, or image. Gemini AI extracts structured data and builds an interactive dashboard instantly.
                </motion.p>
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
