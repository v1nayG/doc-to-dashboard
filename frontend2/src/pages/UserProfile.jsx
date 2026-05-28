import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Shield, ChevronLeft, Mail, Key } from 'lucide-react';

export default function UserProfile({ user, onBack }) {
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordState, setPasswordState] = useState({ current: '', new: '', confirm: '' });
  const [passwordMessage, setPasswordMessage] = useState(null);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordState.new !== passwordState.confirm) {
      setPasswordMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    // Mocking an API call
    setPasswordMessage({ type: 'success', text: 'Password successfully updated!' });
    setTimeout(() => {
      setIsChangingPassword(false);
      setPasswordMessage(null);
      setPasswordState({ current: '', new: '', confirm: '' });
    }, 2000);
  };
  return (
    <div className="app" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav className="navbar" style={{ justifyContent: 'flex-start', gap: '1rem' }}>
        <button onClick={onBack} className="btn btn-ghost" style={{ padding: '6px 12px' }}>
          <ChevronLeft size={16} /> Back to Dashboard
        </button>
        <div className="navbar-logo" style={{ marginLeft: 'auto' }}>
          Profile Settings
        </div>
      </nav>
      
      <div className="content-area" style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '4rem' }}>
        <motion.div 
          className="auth-card" 
          style={{ width: '100%', maxWidth: '600px', padding: '2.5rem' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 600 }}>
              {(user?.username || user?.email || 'U')[0].toUpperCase()}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>{user?.username || 'User'}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', marginTop: '4px' }}>
                <Mail size={14} /> {user?.email}
              </div>
            </div>
          </div>
          
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Preferences</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'var(--bg-elevated)', padding: '8px', borderRadius: '8px' }}>
                  <Shield size={18} className="text-accent" />
                </div>
                <div>
                  <div style={{ fontWeight: 500, fontSize: '0.95rem' }}>Data Privacy</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Opt-out of AI training on your documents</div>
                </div>
              </div>
              <label className="switch">
                <input type="checkbox" defaultChecked />
                <span className="slider round"></span>
              </label>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: 'var(--bg-elevated)', padding: '8px', borderRadius: '8px' }}>
                    <User size={18} className="text-accent" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.95rem' }}>Account Security</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Change password and security settings</div>
                  </div>
                </div>
                <button 
                  className="btn btn-ghost" 
                  onClick={() => setIsChangingPassword(!isChangingPassword)}
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  {isChangingPassword ? 'Cancel' : 'Manage'}
                </button>
              </div>

              <AnimatePresence>
                {isChangingPassword && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: 'hidden', marginTop: '1rem' }}
                  >
                    <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                      <div className="input-group">
                        <label>Current Password</label>
                        <div className="input-with-icon">
                          <Key size={16} className="input-icon" />
                          <input 
                            type="password" 
                            required
                            value={passwordState.current}
                            onChange={(e) => setPasswordState({...passwordState, current: e.target.value})}
                            placeholder="Enter current password" 
                          />
                        </div>
                      </div>
                      <div className="input-group">
                        <label>New Password</label>
                        <div className="input-with-icon">
                          <Key size={16} className="input-icon" />
                          <input 
                            type="password" 
                            required
                            value={passwordState.new}
                            onChange={(e) => setPasswordState({...passwordState, new: e.target.value})}
                            placeholder="Enter new password" 
                          />
                        </div>
                      </div>
                      <div className="input-group">
                        <label>Confirm New Password</label>
                        <div className="input-with-icon">
                          <Key size={16} className="input-icon" />
                          <input 
                            type="password" 
                            required
                            value={passwordState.confirm}
                            onChange={(e) => setPasswordState({...passwordState, confirm: e.target.value})}
                            placeholder="Confirm new password" 
                          />
                        </div>
                      </div>

                      {passwordMessage && (
                        <div style={{ fontSize: '0.8rem', color: passwordMessage.type === 'error' ? 'var(--danger)' : 'var(--success)' }}>
                          {passwordMessage.text}
                        </div>
                      )}

                      <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end', marginTop: '0.5rem' }}>
                        Update Password
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
