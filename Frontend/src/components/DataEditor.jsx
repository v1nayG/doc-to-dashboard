import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Save, X, RefreshCw, FileText, Activity, Code } from 'lucide-react';

const DataEditor = ({ data, onSave, onClose }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [localData, setLocalData] = useState(data || {});
    const [rawJson, setRawJson] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        setLocalData(JSON.parse(JSON.stringify(data))); // Deep clone
        setRawJson(JSON.stringify(data, null, 2));
    }, [data]);

    const handleSave = () => {
        try {
            setError(null);
            // If we are in the advanced tab, try to parse the raw json
            if (activeTab === 'advanced') {
                const parsed = JSON.parse(rawJson);
                onSave(parsed);
            } else {
                // Otherwise save the localData object
                onSave(localData);
            }
        } catch (err) {
            setError('Invalid JSON format. Please fix any syntax errors before saving.');
        }
    };

    const handleReset = () => {
        setLocalData(JSON.parse(JSON.stringify(data)));
        setRawJson(JSON.stringify(data, null, 2));
        setError(null);
    };

    const updateField = (field, value) => {
        setLocalData(prev => ({ ...prev, [field]: value }));
    };

    const updateKPI = (index, field, value) => {
        const newKpis = [...(localData.kpis || [])];
        newKpis[index] = { ...newKpis[index], [field]: value };
        setLocalData(prev => ({ ...prev, kpis: newKpis }));
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
                    style={{ maxWidth: '900px', width: '90%', height: '80vh', display: 'flex', flexDirection: 'column', padding: '1.5rem', background: 'var(--bg-surface)' }}
                    initial={{ y: 30, scale: 0.95 }}
                    animate={{ y: 0, scale: 1 }}
                    exit={{ y: 30, scale: 0.95 }}
                >
                    <div className="dashboard-header" style={{ marginBottom: '0', paddingBottom: '1rem' }}>
                        <div className="dashboard-title-area">
                            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Settings size={20} className="text-accent" />
                                Edit Dashboard Data
                            </h2>
                            <p>Tweak the AI-extracted data before exporting your dashboard.</p>
                        </div>
                        <button onClick={onClose} className="btn btn-ghost" style={{ padding: '6px' }}>
                            <X size={20} />
                        </button>
                    </div>

                    {error && (
                        <div className="error-banner" style={{ margin: '1rem 0 0 0' }}>{error}</div>
                    )}

                    <div className="editor-layout">
                        <div className="editor-sidebar">
                            <button 
                                className={`editor-tab ${activeTab === 'overview' ? 'active' : ''}`}
                                onClick={() => { setActiveTab('overview'); setRawJson(JSON.stringify(localData, null, 2)); }}
                            >
                                <FileText size={16} /> Overview
                            </button>
                            <button 
                                className={`editor-tab ${activeTab === 'kpis' ? 'active' : ''}`}
                                onClick={() => { setActiveTab('kpis'); setRawJson(JSON.stringify(localData, null, 2)); }}
                            >
                                <Activity size={16} /> Key Metrics
                            </button>
                            <div style={{ flex: 1 }} />
                            <button 
                                className={`editor-tab ${activeTab === 'advanced' ? 'active' : ''}`}
                                onClick={() => { setActiveTab('advanced'); setRawJson(JSON.stringify(localData, null, 2)); }}
                            >
                                <Code size={16} /> Advanced (JSON)
                            </button>
                        </div>

                        <div className="editor-content">
                            {activeTab === 'overview' && (
                                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
                                    <h3 className="editor-section-title">General Information</h3>
                                    <div className="input-group">
                                        <label>Dashboard Title</label>
                                        <input 
                                            type="text" 
                                            className="input-field" 
                                            value={localData.title || ''} 
                                            onChange={(e) => updateField('title', e.target.value)} 
                                            placeholder="E.g., Q3 Financial Report"
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Document Type / Badge</label>
                                        <input 
                                            type="text" 
                                            className="input-field" 
                                            value={localData.document_type || ''} 
                                            onChange={(e) => updateField('document_type', e.target.value)} 
                                            placeholder="E.g., Invoice, Report, Analytics"
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Executive Summary</label>
                                        <textarea 
                                            className="input-field" 
                                            value={localData.summary || ''} 
                                            onChange={(e) => updateField('summary', e.target.value)} 
                                            placeholder="Brief overview of the document contents..."
                                        />
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'kpis' && (
                                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
                                    <h3 className="editor-section-title">Key Performance Indicators</h3>
                                    {(!localData.kpis || localData.kpis.length === 0) ? (
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No KPIs extracted from this document.</p>
                                    ) : (
                                        localData.kpis.map((kpi, idx) => (
                                            <div key={idx} className="kpi-editor-card">
                                                <div className="input-group" style={{ marginBottom: '0.75rem' }}>
                                                    <label>Metric Label</label>
                                                    <input 
                                                        type="text" 
                                                        className="input-field" 
                                                        value={kpi.label || ''} 
                                                        onChange={(e) => updateKPI(idx, 'label', e.target.value)} 
                                                    />
                                                </div>
                                                <div className="kpi-editor-grid">
                                                    <div className="input-group" style={{ marginBottom: 0 }}>
                                                        <label>Value</label>
                                                        <input 
                                                            type="text" 
                                                            className="input-field" 
                                                            value={kpi.value || ''} 
                                                            onChange={(e) => updateKPI(idx, 'value', e.target.value)} 
                                                        />
                                                    </div>
                                                    <div className="input-group" style={{ marginBottom: 0 }}>
                                                        <label>Trend</label>
                                                        <select 
                                                            className="input-field" 
                                                            value={kpi.trend || 'neutral'} 
                                                            onChange={(e) => updateKPI(idx, 'trend', e.target.value)}
                                                            style={{ appearance: 'none', WebkitAppearance: 'none' }}
                                                        >
                                                            <option value="up" style={{ color: 'black' }}>Trending Up</option>
                                                            <option value="down" style={{ color: 'black' }}>Trending Down</option>
                                                            <option value="neutral" style={{ color: 'black' }}>Neutral / Flat</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </motion.div>
                            )}

                            {activeTab === 'advanced' && (
                                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <h3 className="editor-section-title" style={{ marginBottom: '0.5rem' }}>Raw JSON Data</h3>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Use this to edit charts, tables, or perform advanced structural changes.</p>
                                    <textarea
                                        value={rawJson}
                                        onChange={(e) => setRawJson(e.target.value)}
                                        style={{
                                            flex: 1, width: '100%', backgroundColor: 'rgba(0,0,0,0.3)', color: 'var(--text-primary)',
                                            border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', padding: '1rem',
                                            fontFamily: 'monospace', fontSize: '0.85rem', resize: 'none', outline: 'none',
                                            whiteSpace: 'pre', overflowWrap: 'normal', overflowX: 'auto',
                                        }}
                                        spellCheck="false"
                                    />
                                </motion.div>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                        <button onClick={handleReset} className="btn btn-ghost">
                            <RefreshCw size={16} /> Reset
                        </button>
                        <button onClick={handleSave} className="btn btn-primary">
                            <Save size={16} /> Save Changes
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default DataEditor;
