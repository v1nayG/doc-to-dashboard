import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import '../landing.css';

const FloatingCard = ({ children, delay = 0, rotate = 0, x = 0, y = 0 }) => (
  <motion.div
    className="floating-card"
    initial={{ opacity: 0, y: 60 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    style={{ rotate, x, y }}
  >
    {children}
  </motion.div>
);

const FEATURES = [
  {
    icon: '🤖',
    color: '#6366f1',
    title: 'Gemini AI Analysis',
    desc: 'Powered by Google Gemini to understand context, extract insights, and generate intelligent summaries from any document.'
  },
  {
    icon: '📊',
    color: '#f59e0b',
    title: 'Auto Chart Generation',
    desc: 'Instantly transforms raw data into beautiful bar charts, line graphs, pie charts, and more — zero manual work required.'
  },
  {
    icon: '🔍',
    color: '#10b981',
    title: 'OCR & Text Extraction',
    desc: 'Handles scanned PDFs and images with advanced optical character recognition, making even old documents searchable.'
  },
  {
    icon: '📁',
    color: '#3b82f6',
    title: '5+ File Formats',
    desc: 'Upload PDFs, Excel, Word, CSV, and images. DocDash adapts to whatever format your data lives in.'
  },
  {
    icon: '🕒',
    color: '#ec4899',
    title: 'Document History',
    desc: 'Every document you analyze is saved automatically. Revisit, compare, and share your dashboards anytime.'
  },
  {
    icon: '⚡',
    color: '#f97316',
    title: 'Lightning Fast',
    desc: 'Average processing time of just 5 seconds. Get from document upload to interactive dashboard in moments.'
  },
];

const DESCRIPTION_CARDS = [
  {
    emoji: '📄',
    title: 'Upload Any Document',
    desc: 'Drop in a PDF report, spreadsheet, or even a scanned image. We accept all common formats.',
    color: '#6366f1',
    rotate: -3,
    zIndex: 1,
  },
  {
    emoji: '🧠',
    title: 'AI Reads & Understands',
    desc: 'Gemini AI scans the content, understands structure, extracts key data points and generates summaries.',
    color: '#10b981',
    rotate: 1,
    zIndex: 2,
  },
  {
    emoji: '📊',
    title: 'Dashboard Generated',
    desc: 'An interactive, beautiful dashboard appears instantly — charts, KPIs, tables, all ready to explore.',
    color: '#f59e0b',
    rotate: -1,
    zIndex: 3,
  },
];

const COLORFUL_WORDS = ['Transform', 'Analyze', 'Visualize', 'Understand'];

export default function LandingPage({ onGetStarted }) {
  const [wordIndex, setWordIndex] = useState(0);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -80]);

  useEffect(() => {
    const timer = setInterval(() => {
      setWordIndex(i => (i + 1) % COLORFUL_WORDS.length);
    }, 2200);
    return () => clearInterval(timer);
  }, []);

  const wordColors = ['#6366f1', '#f59e0b', '#10b981', '#ec4899'];

  return (
    <div className="landing">
      {/* ─── Navbar ─────────────────────────────── */}
      <nav className="landing-nav">
        <div className="landing-nav-logo">
          <div className="landing-logo-mark">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="9" width="3" height="6" rx="1" fill="white" />
              <rect x="6" y="5" width="3" height="10" rx="1" fill="white" opacity="0.8" />
              <rect x="11" y="1" width="3" height="14" rx="1" fill="white" opacity="0.6" />
            </svg>
          </div>
          <span className="landing-brand">DocDash</span>
        </div>
        <div className="landing-nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#about">About</a>
        </div>
        <button className="landing-cta-btn" onClick={onGetStarted} id="nav-get-started">
          Get Started
        </button>
      </nav>

      {/* ─── Hero ───────────────────────────────── */}
      <section className="landing-hero" ref={heroRef} id="hero">
        {/* Floating blobs */}
        <div className="hero-blob hero-blob-1" />
        <div className="hero-blob hero-blob-2" />
        <div className="hero-blob hero-blob-3" />

        {/* Floating mini elements */}
        <motion.div
          className="hero-float-el hero-float-1"
          animate={{ y: [0, -18, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
        >📄</motion.div>
        <motion.div
          className="hero-float-el hero-float-2"
          animate={{ y: [0, 14, 0] }}
          transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut', delay: 1 }}
        >📊</motion.div>
        <motion.div
          className="hero-float-el hero-float-3"
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut', delay: 0.5 }}
        >🤖</motion.div>
        <motion.div
          className="hero-float-el hero-float-4"
          animate={{ y: [0, 12, 0] }}
          transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut', delay: 2 }}
        >⚡</motion.div>

        <motion.div className="hero-content" style={{ y: heroY }}>
          <motion.div
            className="hero-badge"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="hero-badge-dot" />
            AI-Powered · Document Intelligence
          </motion.div>

          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={wordIndex}
                className="hero-word-cycle"
                style={{ color: wordColors[wordIndex] }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                {COLORFUL_WORDS[wordIndex]}
              </motion.span>
            </AnimatePresence>
            <br />
            <span className="hero-title-static">your documents</span>
            <br />
            <span className="hero-title-accent">into live dashboards</span>
          </motion.h1>

          <motion.p
            className="hero-desc"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
          >
            Upload any PDF, spreadsheet, or image. Gemini AI instantly extracts data,
            generates charts, and builds beautiful interactive dashboards — no manual work needed.
          </motion.p>

          <motion.div
            className="hero-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.7 }}
          >
            <button className="hero-btn-primary" onClick={onGetStarted} id="hero-get-started">
              Start for Free
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <a href="#how-it-works" className="hero-btn-ghost">See how it works</a>
          </motion.div>

          <motion.div
            className="hero-stats"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.7 }}
          >
            <div className="hero-stat">
              <span className="hero-stat-value" style={{ color: '#6366f1' }}>5s</span>
              <span className="hero-stat-label">avg. processing</span>
            </div>
            <div className="hero-stat-sep" />
            <div className="hero-stat">
              <span className="hero-stat-value" style={{ color: '#10b981' }}>5+</span>
              <span className="hero-stat-label">file formats</span>
            </div>
            <div className="hero-stat-sep" />
            <div className="hero-stat">
              <span className="hero-stat-value" style={{ color: '#f59e0b' }}>0</span>
              <span className="hero-stat-label">manual work</span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Description Floating Cards ─────────── */}
      <section className="landing-desc-section" id="how-it-works">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <span className="section-chip" style={{ background: '#6366f115', color: '#6366f1' }}>How it works</span>
          <h2 className="section-title">Three steps to <span style={{ color: '#6366f1' }}>instant insights</span></h2>
          <p className="section-sub">From raw document to interactive dashboard in seconds</p>
        </motion.div>

        {/* Stacked floating cards */}
        <div className="desc-cards-container">
          {DESCRIPTION_CARDS.map((card, i) => (
            <motion.div
              key={card.title}
              className="desc-card"
              style={{
                '--card-color': card.color,
                zIndex: card.zIndex,
                rotate: card.rotate,
                marginTop: i === 0 ? 0 : -60,
              }}
              initial={{ opacity: 0, y: 80, rotate: card.rotate - 5 }}
              whileInView={{ opacity: 1, y: 0, rotate: card.rotate }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: i * 0.18, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{
                y: -12,
                rotate: 0,
                zIndex: 10,
                scale: 1.03,
                transition: { duration: 0.3 },
              }}
            >
              <div className="desc-card-step" style={{ background: card.color }}>0{i + 1}</div>
              <div className="desc-card-emoji">{card.emoji}</div>
              <h3 className="desc-card-title" style={{ color: card.color }}>{card.title}</h3>
              <p className="desc-card-desc">{card.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Features ───────────────────────────── */}
      <section className="landing-features" id="features">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <span className="section-chip" style={{ background: '#f59e0b15', color: '#f59e0b' }}>Features</span>
          <h2 className="section-title">Everything you need to <span style={{ color: '#f59e0b' }}>understand your data</span></h2>
          <p className="section-sub">Powerful AI tools wrapped in a beautiful, simple interface</p>
        </motion.div>

        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              className="feature-card"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ delay: i * 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
            >
              <div className="feature-card-icon" style={{ background: f.color + '18', color: f.color }}>
                {f.icon}
              </div>
              <h3 className="feature-card-title" style={{ color: f.color }}>{f.title}</h3>
              <p className="feature-card-desc">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── About ──────────────────────────────── */}
      <section className="landing-about" id="about">
        <div className="about-grid">
          <motion.div
            className="about-text"
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="section-chip" style={{ background: '#ec489915', color: '#ec4899' }}>About DocDash</span>
            <h2 className="section-title" style={{ textAlign: 'left', marginTop: '1rem' }}>
              Built for people who <span style={{ color: '#ec4899' }}>work with data</span>
            </h2>
            <p className="about-desc">
              DocDash was created to eliminate the hours spent manually reading reports, copy-pasting data into spreadsheets, and building charts from scratch.
            </p>
            <p className="about-desc">
              Whether you're a analyst, student, researcher, or business owner — drop in your document and get a full dashboard in under 10 seconds. Powered by Google Gemini's multimodal AI.
            </p>
            <div className="about-pills">
              <span className="about-pill" style={{ background: '#6366f115', color: '#6366f1', border: '1px solid #6366f130' }}>Google Gemini AI</span>
              <span className="about-pill" style={{ background: '#10b98115', color: '#10b981', border: '1px solid #10b98130' }}>React + Vite</span>
              <span className="about-pill" style={{ background: '#f59e0b15', color: '#f59e0b', border: '1px solid #f59e0b30' }}>MongoDB</span>
              <span className="about-pill" style={{ background: '#3b82f615', color: '#3b82f6', border: '1px solid #3b82f630' }}>Node.js</span>
            </div>
            <button className="hero-btn-primary" onClick={onGetStarted} style={{ marginTop: '2rem' }} id="about-get-started">
              Try DocDash Free
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </motion.div>

          <motion.div
            className="about-visual"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="about-card-stack">
              <motion.div
                className="about-mock-card"
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)', color: '#fff' }}
              >
                <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>📊</div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Revenue Report</div>
                <div style={{ opacity: 0.8, fontSize: '0.85rem', marginTop: '0.25rem' }}>Q4 2024 · 24 charts generated</div>
              </motion.div>
              <motion.div
                className="about-mock-card"
                animate={{ y: [0, 8, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut', delay: 1 }}
                style={{ background: 'linear-gradient(135deg, #10b981, #34d399)', color: '#fff' }}
              >
                <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>🧠</div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>AI Insights Ready</div>
                <div style={{ opacity: 0.8, fontSize: '0.85rem', marginTop: '0.25rem' }}>12 KPIs · 3 tables · Summary</div>
              </motion.div>
              <motion.div
                className="about-mock-card"
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut', delay: 0.5 }}
                style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', color: '#fff' }}
              >
                <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>⚡</div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Processed in 4.2s</div>
                <div style={{ opacity: 0.8, fontSize: '0.85rem', marginTop: '0.25rem' }}>PDF · 48 pages · 100% accurate</div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── CTA ────────────────────────────────── */}
      <section className="landing-cta">
        <motion.div
          className="cta-inner"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="cta-blob cta-blob-1" />
          <div className="cta-blob cta-blob-2" />
          <h2 className="cta-title">
            Ready to stop reading and <br />
            <span style={{ color: '#a78bfa' }}>start understanding?</span>
          </h2>
          <p className="cta-desc">Join thousands of people who turned their documents into dashboards with DocDash.</p>
          <button className="cta-btn" onClick={onGetStarted} id="cta-get-started">
            Get Started — It's Free
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </motion.div>
      </section>

      {/* ─── Footer ─────────────────────────────── */}
      <footer className="landing-footer">
        <div className="landing-nav-logo">
          <div className="landing-logo-mark">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="9" width="3" height="6" rx="1" fill="white" />
              <rect x="6" y="5" width="3" height="10" rx="1" fill="white" opacity="0.8" />
              <rect x="11" y="1" width="3" height="14" rx="1" fill="white" opacity="0.6" />
            </svg>
          </div>
          <span className="landing-brand" style={{ fontSize: '0.9rem' }}>DocDash</span>
        </div>
        <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: '0.5rem' }}>
          Powered by Google Gemini AI · Built with ❤️
        </p>
      </footer>
    </div>
  );
}
