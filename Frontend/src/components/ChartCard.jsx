import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { COLORS } from './KPICard'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        {label && <div className="custom-tooltip-label">{label}</div>}
        {payload.map((p, i) => (
          <div key={i} className="custom-tooltip-row" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: i > 0 ? '4px' : '0' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color || p.payload?.fill || 'var(--accent)', display: 'inline-block' }} />
            <div className="custom-tooltip-value" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              {p.name ? `${p.name}: ` : ''}
              <strong style={{ color: 'var(--text-primary)', marginLeft: '4px' }}>
                {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
              </strong>
            </div>
          </div>
        ))}
      </div>
    )
  }
  return null
}

const CHART_TYPES = ['bar', 'line', 'area', 'pie']

const ICONS = {
  bar:  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="6" width="3" height="7" rx="1.5" fill="currentColor"/><rect x="5.5" y="3" width="3" height="10" rx="1.5" fill="currentColor" opacity=".7"/><rect x="10" y="1" width="3" height="12" rx="1.5" fill="currentColor" opacity=".4"/></svg>,
  line: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><polyline points="1,12 5,6 8,9 13,2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  area: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 12 L5 6 L8 9 L13 2 L13 12 Z" fill="currentColor" opacity=".4"/><polyline points="1,12 5,6 8,9 13,2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  pie:  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 7 L7 1 A6 6 0 0 1 13 7 Z" fill="currentColor"/><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="2" fill="none"/></svg>,
}

export default function ChartCard({ chart, index }) {
  const [chartType, setChartType] = useState(chart.type || 'bar')
  const data = chart.data || []

  // Assign a vivid color to each chart based on index
  const lineColor = COLORS[index % COLORS.length]

  const commonProps = { data, margin: { top: 10, right: 10, left: -20, bottom: 0 } }

  // Shared SVG filters for glowing effects
  const renderDefs = () => (
    <defs>
      <filter id={`glow_${index}`} x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <linearGradient id={`areaGrad_${index}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={lineColor} stopOpacity={0.6} />
        <stop offset="100%" stopColor={lineColor} stopOpacity={0.0} />
      </linearGradient>
      <linearGradient id={`barGrad_${index}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={lineColor} stopOpacity={1} />
        <stop offset="100%" stopColor={lineColor} stopOpacity={0.3} />
      </linearGradient>
    </defs>
  );

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            {renderDefs()}
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 8 }} />
            <Bar dataKey="value" fill={`url(#barGrad_${index})`} radius={[6, 6, 6, 6]} barSize={32} />
          </BarChart>
        )
      case 'line':
        return (
          <LineChart {...commonProps}>
            {renderDefs()}
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="value"
              stroke={lineColor} 
              strokeWidth={4}
              dot={false}
              activeDot={{ r: 6, strokeWidth: 0, fill: '#fff', filter: `url(#glow_${index})` }}
              filter={`url(#glow_${index})`} 
            />
          </LineChart>
        )
      case 'area':
        return (
          <AreaChart {...commonProps}>
            {renderDefs()}
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="value"
              stroke={lineColor} 
              strokeWidth={3}
              fill={`url(#areaGrad_${index})`} 
              filter={`url(#glow_${index})`} 
            />
          </AreaChart>
        )
      case 'pie':
        return (
          <PieChart>
            {renderDefs()}
            <Pie 
              data={data} 
              dataKey="value" 
              nameKey="label"
              cx="50%" cy="50%" 
              outerRadius={95} innerRadius={65}
              paddingAngle={5}
              stroke="transparent"
            >
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} filter={`url(#glow_${index})`} />)}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        )
      default: return null
    }
  }

  return (
    <motion.div
      className="chart-card premium-chart"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 + 0.15, type: 'spring', stiffness: 200, damping: 22 }}
    >
      <div className="chart-header">
        <div>
          <div className="chart-title">{chart.title}</div>
          {chart.description && <div className="chart-desc">{chart.description}</div>}
        </div>
        <div className="chart-type-switcher">
          {CHART_TYPES.map(type => (
            <button
              key={type}
              className={`chart-type-btn ${chartType === type ? 'active' : ''}`}
              onClick={() => setChartType(type)}
              title={type}
            >
              {ICONS[type]}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        {renderChart()}
      </ResponsiveContainer>
    </motion.div>
  )
}
