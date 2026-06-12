import { motion } from 'framer-motion'

const COLORS = [
  '#4f46e5', // indigo
  '#ec4899', // pink
  '#8b5cf6', // violet
  '#0ea5e9', // sky
  '#14b8a6', // teal
  '#f59e0b', // amber
  '#ef4444', // red
  '#3b82f6', // blue
]

export default function KPICard({ kpi, index }) {
  const trend = kpi.trend || 'neutral';
  
  // Decide icon colors based on trend or fallback to the index color
  const baseColor = trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : COLORS[index % COLORS.length];

  const renderTrendIcon = () => {
    if (trend === 'up') {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
          <polyline points="17 6 23 6 23 12"></polyline>
        </svg>
      );
    }
    if (trend === 'down') {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
          <polyline points="17 18 23 18 23 12"></polyline>
        </svg>
      );
    }
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    );
  };

  return (
    <motion.div
      className="kpi-card premium-kpi"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 240, damping: 22 }}
      style={{ '--kpi-color': baseColor }}
    >
      <div className="kpi-icon-wrap" style={{ 
        color: baseColor, 
        background: `color-mix(in srgb, ${baseColor} 15%, transparent)`,
        boxShadow: `0 0 20px color-mix(in srgb, ${baseColor} 30%, transparent)`
      }}>
        {renderTrendIcon()}
      </div>

      <div className="kpi-content-wrap">
        <div className="kpi-label">{kpi.label}</div>
        <div className="kpi-value">
          <span className="kpi-unit-prefix">
            {kpi.unit && ['$', '₹', '€', '£'].includes(kpi.unit) ? kpi.unit : ''}
          </span>
          {kpi.value}
          {kpi.unit && !['$', '₹', '€', '£'].includes(kpi.unit) ? (
            <span className="kpi-unit">{kpi.unit}</span>
          ) : null}
        </div>
      </div>
      
      {/* Subtle background glow effect tied to the card color */}
      <div className="kpi-glow-bg" style={{ 
        background: `radial-gradient(circle at 100% 0%, color-mix(in srgb, ${baseColor} 10%, transparent) 0%, transparent 60%)` 
      }}></div>
    </motion.div>
  )
}

export { COLORS }
