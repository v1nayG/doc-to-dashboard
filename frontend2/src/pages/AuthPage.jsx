import { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import AuthContext from '../context/AuthContext';
import '../auth-aurora.css';

/* ── tiny inline SVGs so no extra deps needed ── */
const IconGoogle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="rgba(255,255,255,0.7)"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="rgba(255,255,255,0.6)"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="rgba(255,255,255,0.5)"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="rgba(255,255,255,0.65)"/>
  </svg>
);

const IconGithub = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(255,255,255,0.7)">
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
  </svg>
);

const IconEye = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const IconEyeOff = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const IconBack = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M10 3L5 8l5 5"/>
  </svg>
);

const AuthPage = ({ onSuccess, onBack }) => {
  const { login, register, error, loading } = useContext(AuthContext);
  const [isLogin, setIsLogin] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    let ok;
    if (isLogin) {
      ok = await login(formData.email, formData.password);
    } else {
      ok = await register(formData.username, formData.email, formData.password);
    }
    if (ok && onSuccess) onSuccess();
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({ username: '', email: '', password: '' });
  };

  const steps = [
    { label: 'Create your account', active: true },
    { label: 'Upload your first document', active: false },
    { label: 'Get your AI dashboard', active: false },
  ];

  return (
    <div className="auth-aurora-page">

      {/* ── LEFT: Hero ── */}
      <div className="auth-left">
        <video
          className="auth-left-video"
          autoPlay
          muted
          loop
          playsInline
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260506_081238_406ed0e3-5d83-436e-a512-0bbff7ec5b95.mp4"
            type="video/mp4"
          />
        </video>
        <div className="auth-left-overlay" />

        <motion.div
          className="auth-left-content"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.14, delayChildren: 0.2 } },
          }}
        >
          <motion.div
            className="auth-left-logo"
            variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
          >
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="9" width="3" height="6" rx="1" fill="white" />
              <rect x="6" y="5" width="3" height="10" rx="1" fill="white" opacity="0.8" />
              <rect x="11" y="1" width="3" height="14" rx="1" fill="white" opacity="0.6" />
            </svg>
            DocDash
          </motion.div>

          <motion.h1
            className="auth-left-heading"
            variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
          >
            {isLogin ? 'Welcome back' : 'Join DocDash'}
          </motion.h1>

          <motion.p
            className="auth-left-sub"
            variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
          >
            {isLogin
              ? 'Sign in to access your AI-powered dashboards and document history.'
              : 'Follow these 3 quick steps to activate your workspace.'}
          </motion.p>

          {!isLogin && (
            <motion.div
              className="auth-steps"
              variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
            >
              {steps.map((step, i) => (
                <div className="auth-step" key={i}>
                  <div className={`auth-step-num ${step.active ? 'active' : 'inactive'}`}>{i + 1}</div>
                  <span className={`auth-step-label ${step.active ? 'active' : 'inactive'}`}>{step.label}</span>
                </div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* ── RIGHT: Form ── */}
      <div className="auth-right">
        {onBack && (
          <button className="auth-right-back" onClick={onBack} id="auth-back-btn">
            <IconBack /> Back to Home
          </button>
        )}

        <motion.div
          className="auth-form-wrapper"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <h2 className="auth-form-heading">
            {isLogin ? 'Welcome Back' : 'Create New Account'}
          </h2>
          <p className="auth-form-sub">
            {isLogin
              ? 'Enter your credentials to access your workspace.'
              : 'Input your details to start turning documents into dashboards.'}
          </p>

          {/* Social */}
          <div className="auth-social-row">
            <button type="button" className="auth-social-btn">
              <IconGoogle /> Google
            </button>
            <button type="button" className="auth-social-btn">
              <IconGithub /> GitHub
            </button>
          </div>

          {/* Divider */}
          <div className="auth-divider">
            <div className="auth-divider-line" />
            <span className="auth-divider-text">Or</span>
            <div className="auth-divider-line" />
          </div>

          {/* Error */}
          {error && (
            <motion.div
              className="auth-aurora-error"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="8" cy="8" r="7" /><path d="M8 5v4M8 11v.5" strokeLinecap="round"/>
              </svg>
              {error}
            </motion.div>
          )}

          {/* Form */}
          <form className="auth-aurora-form" onSubmit={handleSubmit}>
            <AnimatePresence mode="popLayout">
              {!isLogin && (
                <motion.div
                  className="auth-aurora-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <label className="auth-aurora-label" htmlFor="auth-username">Username</label>
                  <div className="auth-aurora-input-wrap">
                    <input
                      id="auth-username"
                      className="auth-aurora-input"
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="johndoe"
                      required={!isLogin}
                      autoComplete="username"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="auth-aurora-field">
              <label className="auth-aurora-label" htmlFor="auth-email">Email Address</label>
              <div className="auth-aurora-input-wrap">
                <input
                  id="auth-email"
                  className="auth-aurora-input"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@company.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="auth-aurora-field">
              <label className="auth-aurora-label" htmlFor="auth-password">Password</label>
              <div className="auth-aurora-input-wrap">
                <input
                  id="auth-password"
                  className="auth-aurora-input"
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  minLength="6"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  style={{ paddingRight: '44px' }}
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
              {!isLogin && <p className="auth-hint">At least 6 characters required.</p>}
            </div>

            <button
              type="submit"
              className="auth-aurora-submit"
              disabled={loading}
              id="auth-submit"
            >
              {loading && <span className="auth-aurora-spinner" />}
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div className="auth-aurora-toggle-row">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            <button className="auth-aurora-toggle-btn" onClick={toggleMode} id="auth-toggle">
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
