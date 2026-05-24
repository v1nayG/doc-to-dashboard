import { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthContext from '../context/AuthContext';

const AuthPage = ({ onSuccess, onBack }) => {
    const { login, register, error, loading } = useContext(AuthContext);
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

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

    return (
        <div className="auth2-page">
            {/* Background blobs */}
            <div className="auth2-blob auth2-blob-1" />
            <div className="auth2-blob auth2-blob-2" />
            <div className="auth2-blob auth2-blob-3" />

            {/* Back button */}
            {onBack && (
                <button className="auth2-back-btn" onClick={onBack} id="auth-back-btn">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Back to Home
                </button>
            )}

            <motion.div
                className="auth2-card"
                initial={{ opacity: 0, y: 40, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            >
                {/* Logo */}
                <div className="auth2-logo">
                    <div className="auth2-logo-mark">
                        <svg width="22" height="22" viewBox="0 0 16 16" fill="none">
                            <rect x="1" y="9" width="3" height="6" rx="1" fill="white" />
                            <rect x="6" y="5" width="3" height="10" rx="1" fill="white" opacity="0.8" />
                            <rect x="11" y="1" width="3" height="14" rx="1" fill="white" opacity="0.6" />
                        </svg>
                    </div>
                    <span className="auth2-brand">DocDash</span>
                </div>

                <h2 className="auth2-title">
                    {isLogin ? 'Welcome back 👋' : 'Create your account'}
                </h2>
                <p className="auth2-sub">
                    {isLogin
                        ? 'Sign in to access your dashboards and documents.'
                        : 'Join DocDash and start turning documents into insights.'}
                </p>

                {/* Error */}
                {error && (
                    <motion.div
                        className="auth2-error"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.3 }}
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                            <path d="M8 5v4M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        {error}
                    </motion.div>
                )}

                <form className="auth2-form" onSubmit={handleSubmit}>
                    <AnimatePresence mode="popLayout">
                        {!isLogin && (
                            <motion.div
                                className="auth2-field"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <label htmlFor="auth-username">Username</label>
                                <input
                                    id="auth-username"
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    placeholder="johndoe"
                                    required={!isLogin}
                                    autoComplete="username"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="auth2-field">
                        <label htmlFor="auth-email">Email address</label>
                        <input
                            id="auth-email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="name@company.com"
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="auth2-field">
                        <label htmlFor="auth-password">Password</label>
                        <input
                            id="auth-password"
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            required
                            minLength="6"
                            autoComplete={isLogin ? 'current-password' : 'new-password'}
                        />
                    </div>

                    <button
                        type="submit"
                        className="auth2-submit-btn"
                        disabled={loading}
                        id="auth-submit"
                    >
                        {loading ? (
                            <span className="auth2-spinner" />
                        ) : null}
                        {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                    </button>
                </form>

                <div className="auth2-footer">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <button className="auth2-toggle" onClick={toggleMode} id="auth-toggle">
                        {isLogin ? 'Sign up' : 'Sign in'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default AuthPage;
