import { motion } from 'framer-motion'

const COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--accent)',
  'var(--chart-4)',
  'var(--chart-5)',
]

export default function KPICard({ kpi, index }) {
  const trend = kpi.trend || 'neutral';
  
  // Decide icon colors based on trend or fallback to the index color
  // In aurora theme, "up" is a soft mint green, "down" is a soft rose red
  const baseColor = trend === 'up' ? '#6ee7b7' : trend === 'down' ? '#fda4af' : COLORS[index % COLORS.length];

  const renderTrendIcon = () => {
    if (trend === 'up') {
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
          <polyline points="17 6 23 6 23 12"></polyline>
        </svg>
      );
    }
    if (trend === 'down') {
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
          <polyline points="17 18 23 18 23 12"></polyline>
        </svg>
      );
    }
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        background: `rgba(255, 255, 255, 0.03)`,
        border: `1px solid rgba(255, 255, 255, 0.08)`,
      }}>
        {renderTrendIcon()}
      </div>

      <div className="kpi-content-wrap">
        <div className="kpi-label">{kpi.label}</div>
        <div className="kpi-value" style={{ fontWeight: 300 }}>
          <span className="kpi-unit-prefix" style={{ fontWeight: 400 }}>
            {kpi.unit && ['$', '₹', '€', '£'].includes(kpi.unit) ? kpi.unit : ''}
          </span>
          {kpi.value}
          {kpi.unit && !['$', '₹', '€', '£'].includes(kpi.unit) ? (
            <span className="kpi-unit" style={{ fontWeight: 400 }}>{kpi.unit}</span>
          ) : null}
        </div>
      </div>
      
      {/* Subtle background glow effect tied to the card color, strictly reduced opacity for Aurora */}
      <div className="kpi-glow-bg" style={{ 
        background: `radial-gradient(circle at 100% 0%, color-mix(in srgb, ${baseColor} 10%, transparent) 0%, transparent 60%)`,
        opacity: 0.6
      }}></div>
    </motion.div>
  )
}

export { COLORS }
