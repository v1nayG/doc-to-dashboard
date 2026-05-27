import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Monitor, Palette, Zap, Cpu, ScanText, Files, History, BarChart3, Brain, FileText, LayoutDashboard } from 'lucide-react';
import '../landing.css';
import '../xero.css';

const DESCRIPTION_CARDS = [
  {
    icon: <FileText size={32} strokeWidth={2.5} color="rgba(255,255,255,0.9)" />,
    title: 'Upload Any Document',
    desc: 'Drop in a PDF report, spreadsheet, or even a scanned image. We accept all common formats.',
    gradient: 'linear-gradient(137deg, #FF3D77 0%, #FFB1CE 45%, #FF9D3C 100%)',
    delay: 0.1,
  },
  {
    icon: <Brain size={32} strokeWidth={2.5} color="rgba(255,255,255,0.9)" />,
    title: 'AI Reads & Understands',
    desc: 'Gemini AI scans the content, understands structure, extracts key data points and generates summaries.',
    gradient: 'linear-gradient(137deg, #FFFFFF 0%, #7DD3FC 45%, #06B6D4 100%)',
    delay: 0.2,
  },
  {
    icon: <LayoutDashboard size={32} strokeWidth={2.5} color="rgba(255,255,255,0.9)" />,
    title: 'Dashboard Generated',
    desc: 'An interactive, beautiful dashboard appears instantly — charts, KPIs, tables, all ready to explore.',
    gradient: 'linear-gradient(137deg, #4361EE 0%, #E0AEFF 45%, #F72585 100%)',
    delay: 0.3,
  },
];

const FEATURES = [
  { icon: <Cpu size={24} strokeWidth={1.5} />, title: 'Gemini AI Analysis',    desc: 'Powered by Google Gemini to understand context, extract insights, and generate intelligent summaries from any document.' },
  { icon: <BarChart3 size={24} strokeWidth={1.5} />, title: 'Auto Chart Generation', desc: 'Instantly transforms raw data into beautiful bar charts, line graphs, pie charts, and more — zero manual work required.' },
  { icon: <ScanText size={24} strokeWidth={1.5} />, title: 'OCR & Text Extraction', desc: 'Handles scanned PDFs and images with advanced optical character recognition, making even old documents searchable.' },
  { icon: <Files size={24} strokeWidth={1.5} />, title: '5+ File Formats',       desc: 'Upload PDFs, Excel, Word, CSV, and images. DocDash adapts to whatever format your data lives in.' },
  { icon: <History size={24} strokeWidth={1.5} />, title: 'Document History',      desc: 'Every document you analyze is saved automatically. Revisit, compare, and share your dashboards anytime.' },
  { icon: <Zap size={24} strokeWidth={1.5} />, title: 'Lightning Fast',        desc: 'Average processing time of just 5 seconds. Get from document upload to interactive dashboard in moments.' },
];

export default function LandingPage({ onGetStarted }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const pipelineRef  = useRef(null);
  const nodeStackRef = useRef(null);
  const nodeXRef     = useRef(null);
  const nodeShieldRef= useRef(null);
  const beam1Ref     = useRef(null);
  const beam2Ref     = useRef(null);
  const gradientRef  = useRef(null);
  const splashRef    = useRef(null);

  useEffect(() => {
    let rafId;
    let state = 'p1';
    let stateStart = performance.now();

    const pipeline   = pipelineRef.current;
    const nodeStack  = nodeStackRef.current;
    const nodeX      = nodeXRef.current;
    const nodeShield = nodeShieldRef.current;
    const beam1      = beam1Ref.current;
    const beam2      = beam2Ref.current;
    const gradient   = gradientRef.current;
    const splash     = splashRef.current;

    const updatePath = () => {
      if (!pipeline || !nodeStack || !nodeX || !nodeShield || !beam1 || !beam2) return;
      const pR  = pipeline.getBoundingClientRect();
      const sR  = nodeStack.getBoundingClientRect();
      const xR  = nodeX.getBoundingClientRect();
      const shR = nodeShield.getBoundingClientRect();
      const sx = sR.left + sR.width / 2 - pR.left;
      const sy = sR.top  + sR.height/ 2 - pR.top;
      const mx = xR.left + xR.width / 2 - pR.left;
      const my = xR.top  + xR.height/ 2 - pR.top;
      const ex = shR.left + shR.width / 2 - pR.left;
      const ey = shR.top  + shR.height/ 2 - pR.top;
      const d = `M ${sx},${sy} L ${mx},${my} L ${ex},${ey}`;
      beam1.setAttribute('d', d);
      beam2.setAttribute('d', d);
    };

    updatePath();
    window.addEventListener('resize', updatePath);

    const animate = (now) => {
      const elapsed = now - stateStart;
      if (state === 'p1') {
        const p = Math.min(elapsed / 800, 1);
        const center = p * 0.5 * 100;
        gradient?.setAttribute('x1', `${center - 5}%`);
        gradient?.setAttribute('x2', `${center + 5}%`);
        if (p < 0.4) nodeStack?.classList.add('active');
        else         nodeStack?.classList.remove('active');
        if (p >= 1) {
          state = 'splash'; stateStart = now;
          if (beam1) beam1.style.opacity = '0';
          if (beam2) beam2.style.opacity = '0';
          splash?.classList.add('animate');
        }
      } else if (state === 'splash') {
        if (elapsed >= 800) {
          state = 'p2'; stateStart = now;
          splash?.classList.remove('animate');
          if (beam1) beam1.style.opacity = '1';
          if (beam2) beam2.style.opacity = '1';
        }
      } else if (state === 'p2') {
        const p = Math.min(elapsed / 800, 1);
        const center = (0.5 + p * 0.5) * 100;
        gradient?.setAttribute('x1', `${center - 5}%`);
        gradient?.setAttribute('x2', `${center + 5}%`);
        if (p > 0.6) nodeShield?.classList.add('active');
        else         nodeShield?.classList.remove('active');
        if (p >= 1) { nodeShield?.classList.remove('active'); state = 'idle'; stateStart = now; }
      } else if (state === 'idle') {
        if (elapsed >= 1000) { state = 'p1'; stateStart = now; }
      }
      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => { window.removeEventListener('resize', updatePath); cancelAnimationFrame(rafId); };
  }, []);

  const toggleMenu = () => {
    setMenuOpen(o => {
      document.body.style.overflow = !o ? 'hidden' : '';
      return !o;
    });
  };

  return (
    <div className="landing">
      {/* ══ HERO WRAPPER (xero aesthetic) ══════════════════════════ */}
      <div className="xero-hero-wrapper">
        <nav className="xero-nav">
          <span className="nav-logo">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="9" width="3" height="6" rx="1" fill="white"/>
              <rect x="6" y="5" width="3" height="10" rx="1" fill="white" opacity="0.8"/>
              <rect x="11" y="1" width="3" height="14" rx="1" fill="white" opacity="0.6"/>
            </svg>
            DocDash
          </span>
          <button className={`menu-toggle ${menuOpen ? 'active' : ''}`} onClick={toggleMenu}>
            <span/><span/>
          </button>
          <div className={`nav-menu ${menuOpen ? 'active' : ''}`}>
            <ul className="nav-links">
              <li><a href="#how-it-works" onClick={toggleMenu}>How it works</a></li>
              <li><a href="#features"     onClick={toggleMenu}>Features</a></li>
              <li><a href="#about"        onClick={toggleMenu}>About</a></li>
            </ul>
            <div className="nav-actions">
              <button className="btn-login"  onClick={() => { toggleMenu(); onGetStarted(); }}>Sign In</button>
              <button className="btn-signup" onClick={() => { toggleMenu(); onGetStarted(); }}>Start Free</button>
            </div>
          </div>
        </nav>

        <section className="hero-card">
          <div className="hero-grid"/>

          {/* Pipeline */}
          <div className="icon-pipeline" ref={pipelineRef}>
            <svg className="beam-svg" preserveAspectRatio="none">
              <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2" result="blur"/>
                  <feComposite in="SourceGraphic" in2="blur" operator="over"/>
                </filter>
                <linearGradient id="beam-gradient" gradientUnits="userSpaceOnUse" ref={gradientRef}>
                  <stop offset="0%"   stopColor="#b04090" stopOpacity="0"/>
                  <stop offset="20%"  stopColor="#b04090" stopOpacity="0.8"/>
                  <stop offset="50%"  stopColor="#fff"    stopOpacity="1"/>
                  <stop offset="80%"  stopColor="#c8a0e0" stopOpacity="0.8"/>
                  <stop offset="100%" stopColor="#c8a0e0" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <path ref={beam1Ref} stroke="url(#beam-gradient)" strokeWidth="2"   filter="url(#glow)" opacity="0.6" fill="none"/>
              <path ref={beam2Ref} stroke="url(#beam-gradient)" strokeWidth="0.8" fill="none"/>
            </svg>

            <div className="icon-node node-light-right" id="node-stack" ref={nodeStackRef}>
              <svg viewBox="0 0 24 24">
                <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                <polyline points="2 17 12 22 22 17"/>
                <polyline points="2 12 12 17 22 12"/>
              </svg>
            </div>
            <div className="pipeline-line"/>
            <div className="center-wrapper">
              <div className="splash" ref={splashRef}/>
              <div className="icon-node-center" id="node-x" ref={nodeXRef}>
                <svg width="28" height="28" viewBox="0 0 16 16" fill="none">
                  <rect x="1" y="9" width="3" height="6" rx="1" fill="white"/>
                  <rect x="6" y="5" width="3" height="10" rx="1" fill="white" opacity="0.8"/>
                  <rect x="11" y="1" width="3" height="14" rx="1" fill="white" opacity="0.6"/>
                </svg>
              </div>
            </div>
            <div className="pipeline-line right"/>
            <div className="icon-node node-light-left" id="node-shield" ref={nodeShieldRef}>
              <svg viewBox="0 0 24 24">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <polyline points="9 12 11 14 15 10"/>
              </svg>
            </div>
          </div>

          {/* Hero text */}
          <div className="hero-content">
            <h1 className="hero-heading">
              Turn documents into
              <strong>interactive dashboards</strong>
            </h1>
            <p className="hero-sub">
              Powered by Google Gemini to understand context, extract insights, and generate intelligent summaries from any document.
            </p>
            <button className="btn-cta" onClick={onGetStarted}>Start Analyzing Free</button>
          </div>
        </section>

        {/* Supported formats */}
        <div className="brands">
          <div className="brand-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
              <line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/>
            </svg>
            PDF
          </div>
          <div className="brand-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/>
              <line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/>
            </svg>
            Excel / CSV
          </div>
          <div className="brand-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
              <line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/><line x1="9" y1="9" x2="11" y2="9"/>
            </svg>
            Word / DOCX
          </div>
          <div className="brand-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            Images / JPG
          </div>
          <div className="brand-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
              <path d="M10 13l-2 5 2-2 2 2-2-5"/><path d="M14 13l-2 5 2-2 2 2-2-5"/>
            </svg>
            Scanned Docs
          </div>
        </div>
      </div>

      {/* ══ HOW IT WORKS ══════════════════════════════════════════ */}
      <section className="landing-desc-section" id="how-it-works">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}
        >
          <span className="section-chip">How it works</span>
          <h2 className="section-title">Three steps to <strong>instant insights</strong></h2>
          <p className="section-sub">From raw document to interactive dashboard in seconds</p>
        </motion.div>

        <div className="desc-cards-container">
          {DESCRIPTION_CARDS.map((card, i) => (
            <motion.div
              key={card.title}
              className="desc-card-wrapper group"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: card.delay, duration: 0.8, ease: "easeOut" }}
            >
              <div 
                className="desc-card-glow" 
                style={{ background: card.gradient }} 
              />
              <div 
                className="desc-card" 
                style={{ 
                  background: `linear-gradient(#1A1A1C, #1A1A1C) padding-box, ${card.gradient} border-box`
                }}
              >
                <div className="desc-card-content">
                  <div className="desc-card-icon">{card.icon}</div>
                  <div>
                    <h3 className="desc-card-title">{card.title}</h3>
                    <p className="desc-card-desc">{card.desc}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══ FEATURES ══════════════════════════════════════════════ */}
      <section className="landing-features" id="features">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}
        >
          <span className="section-chip">Features</span>
          <h2 className="section-title">Everything you need to <strong>understand your data</strong></h2>
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
              transition={{ delay: i * 0.08, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
            >
              <div className="feature-card-icon">{f.icon}</div>
              <h3 className="feature-card-title">{f.title}</h3>
              <p className="feature-card-desc">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══ ABOUT ═════════════════════════════════════════════════ */}
      <section className="landing-about" id="about">
        <div className="about-grid">
          <motion.div
            className="about-text"
            initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="section-chip">About DocDash</span>
            <h2 className="section-title" style={{ textAlign: 'left', marginTop: '1rem' }}>
              Built for people who <strong>work with data</strong>
            </h2>
            <p className="about-desc">
              DocDash was created to eliminate the hours spent manually reading reports, copy-pasting data into spreadsheets, and building charts from scratch.
            </p>
            <p className="about-desc">
              Whether you're an analyst, student, researcher, or business owner — drop in your document and get a full dashboard in under 10 seconds. Powered by Google Gemini's multimodal AI.
            </p>
            <div className="about-pills">
              <span className="about-pill">Google Gemini AI</span>
              <span className="about-pill">React + Vite</span>
              <span className="about-pill">MongoDB</span>
              <span className="about-pill">Node.js</span>
            </div>
            <button className="hero-btn-primary" onClick={onGetStarted} style={{ marginTop: '2rem' }} id="about-get-started">
              Try DocDash Free
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </motion.div>

          <motion.div
            className="about-visual"
            initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="about-card-stack">
              {[
                { icon: <BarChart3 size={26} strokeWidth={1.5} />, title: 'Revenue Report',     sub: 'Q4 2024 · 24 charts generated' },
                { icon: <Brain size={26} strokeWidth={1.5} />, title: 'AI Insights Ready',  sub: '12 KPIs · 3 tables · Summary'  },
                { icon: <Zap size={26} strokeWidth={1.5} />, title: 'Processed in 4.2s',  sub: 'PDF · 48 pages · 100% accurate' },
              ].map((card, i) => (
                <motion.div
                  key={card.title}
                  className="about-mock-card"
                  animate={{ y: [0, i % 2 === 0 ? -8 : 8, 0] }}
                  transition={{ repeat: Infinity, duration: 4 + i, ease: 'easeInOut', delay: i * 0.8 }}
                >
                  <div style={{ marginBottom: '0.5rem', color: '#c8a0e0' }}>{card.icon}</div>
                  <div style={{ fontWeight: 500, fontSize: '1rem', color: '#f0f0f5' }}>{card.title}</div>
                  <div style={{ opacity: 0.4, fontSize: '0.82rem', marginTop: '0.2rem' }}>{card.sub}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══ CTA ═══════════════════════════════════════════════════ */}
      <section className="landing-cta">
        <motion.div
          className="cta-inner"
          initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="cta-title">
            Ready to stop reading and<br/>
            <strong>start understanding?</strong>
          </h2>
          <p className="cta-desc">Turn any document into an interactive dashboard in seconds with DocDash.</p>
          <button className="cta-btn" onClick={onGetStarted} id="cta-get-started">
            Get Started — It's Free
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </motion.div>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════════════ */}
      <footer className="landing-footer">
        <div className="landing-nav-logo">
          <div className="landing-logo-mark">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="9" width="3" height="6" rx="1" fill="white"/>
              <rect x="6" y="5" width="3" height="10" rx="1" fill="white" opacity="0.8"/>
              <rect x="11" y="1" width="3" height="14" rx="1" fill="white" opacity="0.6"/>
            </svg>
          </div>
          <span className="landing-brand">DocDash</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.82rem' }}>
          Powered by Google Gemini AI · Built with ❤️
        </p>
      </footer>
    </div>
  );
}
