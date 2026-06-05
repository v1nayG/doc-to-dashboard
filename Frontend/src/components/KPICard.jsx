import { motion } from 'framer-motion'

// Professional neutral palette for charts/KPIs
const COLORS = [
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#64748b', // slate
  '#0ea5e9', // sky
  '#14b8a6', // teal
  '#f59e0b', // amber
  '#ef4444', // red
]

export default function KPICard({ kpi, index }) {
  const trend = kpi.trend || 'neutral';

  const renderTrendIcon = () => {
    if (trend === 'up') {
      return (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
          <polyline points="17 6 23 6 23 12"></polyline>
        </svg>
      );
    }
    if (trend === 'down') {
      return (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
          <polyline points="17 18 23 18 23 12"></polyline>
        </svg>
      );
    }
    return (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    );
  };

  return (
    <motion.div
      className="kpi-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 240, damping: 22 }}
    >
      <div className="kpi-label">{kpi.label}</div>
      <div className="kpi-value">
        {kpi.unit && ['$', '₹', '€', '£'].includes(kpi.unit) ? kpi.unit : ''}
        {kpi.value}
        {kpi.unit && !['$', '₹', '€', '£'].includes(kpi.unit) ? (
          <span className="kpi-unit">{kpi.unit}</span>
        ) : null}
      </div>
      <div className={`kpi-trend ${trend}`}>
        {renderTrendIcon()}
        <span style={{ marginLeft: '4px' }}>{trend === 'neutral' ? 'stable' : trend}</span>
      </div>
    </motion.div>
  )
}

export { COLORS }
