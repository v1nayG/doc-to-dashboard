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
  const trendIcon = kpi.trend === 'up' ? '↑' : kpi.trend === 'down' ? '↓' : '→'

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
      <div className={`kpi-trend ${kpi.trend || 'neutral'}`}>
        {trendIcon}&nbsp;{kpi.trend || 'stable'}
      </div>
    </motion.div>
  )
}

export { COLORS }
