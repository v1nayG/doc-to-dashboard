import { useState, useEffect, useContext, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, LogOut, Settings, ChevronDown } from 'lucide-react'
import axios from 'axios'
import UploadZone from './components/UploadZone'
import Dashboard from './components/Dashboard'
import Loader from './components/Loader'
import Sidebar from './components/Sidebar'
import AuthPage from './pages/AuthPage'
import LandingPage from './pages/LandingPage'
import UserProfile from './pages/UserProfile'
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
  PROFILE: 'profile',
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
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

  // ── User Profile Page ───────────────────────
  if (page === PAGE.PROFILE && user) {
    return (
      <UserProfile user={user} onBack={() => navigate(PAGE.APP)} />
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
          
          <div className="dropdown-container" ref={userMenuRef}>
            <button 
              className="btn btn-ghost" 
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--border-strong)', borderRadius: '20px' }}
            >
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600 }}>
                {(user?.username || user?.email || 'U')[0].toUpperCase()}
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                {user?.username || user?.email?.split('@')[0] || 'User'}
              </span>
              <ChevronDown size={14} style={{ opacity: 0.5, transform: userMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            <AnimatePresence>
              {userMenuOpen && (
                <motion.div 
                  className="dropdown-menu"
                  initial={{ opacity: 0, y: -5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -5, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  style={{ minWidth: 200, padding: '8px' }}
                >
                  <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', marginBottom: '4px' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user?.username || 'User Account'}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
                  </div>
                  
                  <button className="dropdown-item" onClick={() => { setUserMenuOpen(false); navigate(PAGE.PROFILE); }}>
                    <User size={14} />
                    Profile Settings
                  </button>
                  
                  <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                  
                  <button className="dropdown-item" onClick={handleLogout} style={{ color: 'var(--red)' }}>
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
