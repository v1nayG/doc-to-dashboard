import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import KPICard from './KPICard'
import ChartCard from './ChartCard'
import html2canvas from 'html2canvas'

export default function Dashboard({ data, onReset }) {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const el = document.getElementById('dashboard-content')
      const canvas = await html2canvas(el, {
        backgroundColor: '#141414',
        scale: 2,
        useCORS: true,
      })
      const link = document.createElement('a')
      link.download = `${data.title || 'dashboard'}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('Export failed:', err)
    }
    setExporting(false)
  }

  const kpis   = data.kpis   || []
  const charts = data.charts || []
  const tables = data.tables || []

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-title-area">
          {data.document_type && (
            <div className="doc-badge">{data.document_type}</div>
          )}
          <h2>{data.title || 'Generated Dashboard'}</h2>
          {data.fileName && (
            <p>{data.fileName}</p>
          )}
        </div>
        <div className="dashboard-actions">
          <button className="btn btn-ghost" onClick={onReset}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 4 4 4 4 15"/>
              <path d="M15 4L8.5 10.5"/>
            </svg>
            New Document
          </button>
          <button className="btn btn-primary" onClick={handleExport} disabled={exporting}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 2v9M4 8l4 4 4-4"/><line x1="2" y1="14" x2="14" y2="14"/>
            </svg>
            {exporting ? 'Exporting…' : 'Export PNG'}
          </button>
        </div>
      </div>

      <div id="dashboard-content">
        {/* Summary */}
        {data.summary && (
          <motion.div
            className="summary-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <strong>Summary — </strong>{data.summary}
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
