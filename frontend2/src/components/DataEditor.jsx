import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Save, X, RefreshCw } from 'lucide-react';

const DataEditor = ({ data, onSave, onClose }) => {
    const [editedData, setEditedData] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        // Format JSON nicely with 2 spaces
        setEditedData(JSON.stringify(data, null, 2));
    }, [data]);

    const handleSave = () => {
        try {
            setError(null);
            const parsed = JSON.parse(editedData);
            onSave(parsed);
        } catch (err) {
            setError('Invalid JSON format. Please fix any syntax errors before saving.');
        }
    };

    const handleReset = () => {
        setEditedData(JSON.stringify(data, null, 2));
        setError(null);
    };

    return (
        <AnimatePresence>
            <motion.div 
                className="loader-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div 
                    className="auth-card" 
                    style={{ maxWidth: '800px', width: '90%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '1.5rem' }}
                    initial={{ y: 30, scale: 0.95 }}
                    animate={{ y: 0, scale: 1 }}
                    exit={{ y: 30, scale: 0.95 }}
                >
                    <div className="dashboard-header" style={{ marginBottom: '1rem', paddingBottom: '1rem' }}>
                        <div className="dashboard-title-area">
                            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Settings size={20} className="text-accent" />
                                Edit Dashboard Data
                            </h2>
                            <p>Manually correct any mistakes made by the AI extraction.</p>
                        </div>
                        <button onClick={onClose} className="btn btn-ghost" style={{ padding: '6px' }}>
                            <X size={20} />
                        </button>
                    </div>

                    {error && (
                        <div className="error-banner" style={{ margin: '0 0 1rem 0' }}>
                            {error}
                        </div>
                    )}

                    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <textarea
                            value={editedData}
                            onChange={(e) => setEditedData(e.target.value)}
                            style={{
                                flex: 1,
                                width: '100%',
                                backgroundColor: 'var(--bg-base)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-md)',
                                padding: '1rem',
                                fontFamily: 'monospace',
                                fontSize: '0.85rem',
                                resize: 'none',
                                outline: 'none',
                                whiteSpace: 'pre',
                                overflowWrap: 'normal',
                                overflowX: 'auto',
                            }}
                            spellCheck="false"
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
                        <button onClick={handleReset} className="btn btn-ghost">
                            <RefreshCw size={16} /> Reset
                        </button>
                        <button onClick={handleSave} className="btn btn-primary">
                            <Save size={16} /> Save & Update Charts
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default DataEditor;
