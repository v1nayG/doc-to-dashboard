import { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthContext from '../context/AuthContext';
import '../auth-aurora.css';



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
