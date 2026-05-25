import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Save, X, RefreshCw } from 'lucide-react';

const DataEditor = ({ data, onSave, onClose }) => {
    const [editedData, setEditedData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Deep copy to avoid mutating original props
        setEditedData(JSON.parse(JSON.stringify(data)));
    }, [data]);

    const handleSave = () => {
        try {
            setError(null);
            onSave(editedData);
        } catch (err) {
            setError('An error occurred while saving.');
        }
    };

    const handleReset = () => {
        setEditedData(JSON.parse(JSON.stringify(data)));
        setError(null);
    };

    const handleCellChange = (tableIndex, rowIndex, cellIndex, newValue) => {
        const newData = { ...editedData };
        newData.tables[tableIndex].rows[rowIndex][cellIndex] = newValue;
        setEditedData(newData);
    };

    const handleHeaderChange = (tableIndex, headerIndex, newValue) => {
        const newData = { ...editedData };
        newData.tables[tableIndex].headers[headerIndex] = newValue;
        setEditedData(newData);
    };

    if (!editedData) return null;

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
                    style={{ maxWidth: '900px', width: '90%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '1.5rem', overflow: 'hidden' }}
                    initial={{ y: 30, scale: 0.95 }}
                    animate={{ y: 0, scale: 1 }}
                    exit={{ y: 30, scale: 0.95 }}
                >
                    <div className="dashboard-header" style={{ marginBottom: '1rem', paddingBottom: '1rem' }}>
                        <div className="dashboard-title-area">
                            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Settings size={20} className="text-accent" />
                                Data Editor
                            </h2>
                            <p>Edit your extracted data directly in this spreadsheet.</p>
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

                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {(!editedData.tables || editedData.tables.length === 0) ? (
                            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <p>No table data extracted. Please upload a document containing structured data.</p>
                            </div>
                        ) : (
                            editedData.tables.map((table, tIndex) => (
                                <div key={tIndex} className="editor-table-wrapper">
                                    {table.title && <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{table.title}</h3>}
                                    <div className="editor-table-container">
                                        <table className="editor-table">
                                            <thead>
                                                <tr>
                                                    {table.headers.map((h, hIndex) => (
                                                        <th key={hIndex}>
                                                            <input 
                                                                className="editor-input editor-header-input"
                                                                value={h}
                                                                onChange={(e) => handleHeaderChange(tIndex, hIndex, e.target.value)}
                                                            />
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {table.rows.map((row, rIndex) => (
                                                    <tr key={rIndex}>
                                                        {row.map((cell, cIndex) => (
                                                            <td key={cIndex}>
                                                                <input 
                                                                    className="editor-input"
                                                                    value={cell}
                                                                    onChange={(e) => handleCellChange(tIndex, rIndex, cIndex, e.target.value)}
                                                                />
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))
                        )}
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
