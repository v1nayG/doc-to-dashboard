import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import KPICard from './KPICard'
import ChartCard from './ChartCard'
import DataEditor from './DataEditor'
import html2canvas from 'html2canvas'

export default function Dashboard({ data, onReset }) {
  const [exporting, setExporting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentData, setCurrentData] = useState(data)

  useEffect(() => {
    setCurrentData(data)
  }, [data])

  const handleExportPNG = async () => {
    setExporting(true)
    try {
      const el = document.getElementById('dashboard-content')
      const theme = document.documentElement.getAttribute('data-theme')
      const bgColor = theme === 'dark' ? '#202124' : '#FFFFFF'
      const canvas = await html2canvas(el, {
        backgroundColor: bgColor,
        scale: 2,
        useCORS: true,
      })
      const link = document.createElement('a')
      link.download = `${currentData.title || 'dashboard'}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('Export failed:', err)
    }
    setExporting(false)
  }

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentData, null, 2));
    const link = document.createElement('a');
    link.href = dataStr;
    link.download = `${currentData.title || 'dashboard'}_data.json`;
    link.click();
  }

  const handleExportCSV = () => {
    // Basic CSV export for tables
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (currentData.tables && currentData.tables.length > 0) {
      currentData.tables.forEach(table => {
        csvContent += `${table.title}\n`;
        csvContent += table.headers.join(",") + "\n";
        table.rows.forEach(row => {
          // Escape quotes and wrap in quotes to handle commas inside cells
          const csvRow = row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",");
          csvContent += csvRow + "\n";
        });
        csvContent += "\n";
      });
    } else {
      csvContent += "No table data available\n";
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${currentData.title || 'dashboard'}_tables.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const handleSaveEdit = (newData) => {
    setCurrentData(newData);
    setIsEditing(false);
  }

  const kpis   = currentData.kpis   || []
  const charts = currentData.charts || []
  const tables = currentData.tables || []

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {isEditing && (
        <DataEditor 
          data={currentData} 
          onSave={handleSaveEdit} 
          onClose={() => setIsEditing(false)} 
        />
      )}

      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-title-area">
          {currentData.document_type && (
            <div className="doc-badge">{currentData.document_type}</div>
          )}
          <h2>{currentData.title || 'Generated Dashboard'}</h2>
          {currentData.fileName && (
            <p>{currentData.fileName}</p>
          )}
        </div>
        <div className="dashboard-actions">
          <button className="btn btn-ghost" onClick={() => setIsEditing(true)}>
            Edit Data
          </button>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button className="btn btn-ghost" onClick={handleExportJSON} style={{ padding: '8px 10px' }}>
              JSON
            </button>
            <button className="btn btn-ghost" onClick={handleExportCSV} style={{ padding: '8px 10px' }}>
              CSV
            </button>
          </div>
          <button className="btn btn-primary" onClick={handleExportPNG} disabled={exporting}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 2v9M4 8l4 4 4-4"/><line x1="2" y1="14" x2="14" y2="14"/>
            </svg>
            {exporting ? 'Exporting…' : 'Export PNG'}
          </button>
          <button className="btn btn-ghost" onClick={onReset} style={{ marginLeft: '8px' }}>
            New
          </button>
        </div>
      </div>

      <div id="dashboard-content">
        {/* Summary */}
        {currentData.summary && (
          <motion.div
            className="summary-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <strong>Summary — </strong>{currentData.summary}
          </motion.div>
        )}

        {/* KPIs */}
        {kpis.length > 0 && (
          <>
            <div className="section-label">Key Metrics</div>
            <div className="kpi-grid" style={{ marginBottom: '2.5rem' }}>
              {kpis.map((kpi, i) => (
                <KPICard key={i} kpi={kpi} index={i} />
              ))}
            </div>
          </>
        )}

        {/* Charts */}
        {charts.length > 0 && (
          <>
            <div className="section-label">Charts & Visualizations</div>
            <div className="charts-grid">
              {charts.map((chart, i) => (
                <ChartCard key={chart.id || i} chart={chart} index={i} />
              ))}
            </div>
          </>
        )}

        {/* Tables */}
        {tables.length > 0 && (
          <div className="tables-section">
            <div className="section-label">Data Tables</div>
            {tables.map((table, ti) => (
              <div key={ti} className="table-wrapper">
                {table.title && <div className="table-heading">{table.title}</div>}
                <div className="table-scroll">
                  <table className="data-table">
                    <thead>
                      <tr>{(table.headers || []).map((h, i) => <th key={i}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {(table.rows || []).map((row, ri) => (
                        <tr key={ri}>
                          {row.map((cell, ci) => <td key={ci}>{cell}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {kpis.length === 0 && charts.length === 0 && tables.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
              </svg>
            </div>
            <h3>Couldn't extract enough data</h3>
            <p>Try uploading a document with tables, numbers, or structured data.</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
