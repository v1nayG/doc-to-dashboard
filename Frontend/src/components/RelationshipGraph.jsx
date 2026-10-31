import { useMemo, useState } from 'react'

const WIDTH = 900
const HEIGHT = 520
const TYPE_COLORS = {
  document: 'var(--accent)',
  metric: 'var(--chart-1)',
  organization: 'var(--chart-2)',
  person: 'var(--chart-3)',
  location: 'var(--chart-4)',
  product: 'var(--chart-5)',
  date: 'var(--chart-3)',
  event: 'var(--chart-2)',
  concept: 'var(--chart-4)',
  other: 'var(--text-muted)',
}

// Deterministic pseudo-random so the same graph lays out the same way each render.
const seeded = seed => () => {
  seed = (seed * 9301 + 49297) % 233280
  return seed / 233280
}

const runForceLayout = (nodes, edges) => {
  const random = seeded(nodes.length * 17 + edges.length)
  const positions = nodes.map(() => ({
    x: WIDTH / 2 + (random() - 0.5) * WIDTH * 0.6,
    y: HEIGHT / 2 + (random() - 0.5) * HEIGHT * 0.6,
    vx: 0,
    vy: 0,
  }))
  const index = new Map(nodes.map((node, position) => [node.id, position]))
  const links = edges
    .map(edge => [index.get(edge.source), index.get(edge.target)])
    .filter(([source, target]) => source !== undefined && target !== undefined)
  const repulsion = 2600
  const springLength = 90
  const iterations = 220

  for (let step = 0; step < iterations; step += 1) {
    const cooling = 1 - step / iterations
    for (let a = 0; a < positions.length; a += 1) {
      for (let b = a + 1; b < positions.length; b += 1) {
        const dx = positions[a].x - positions[b].x
        const dy = positions[a].y - positions[b].y
        const distance = Math.max(12, Math.hypot(dx, dy))
        const force = repulsion / (distance * distance)
        positions[a].vx += (dx / distance) * force
        positions[a].vy += (dy / distance) * force
        positions[b].vx -= (dx / distance) * force
        positions[b].vy -= (dy / distance) * force
      }
    }
    for (const [source, target] of links) {
      const dx = positions[target].x - positions[source].x
      const dy = positions[target].y - positions[source].y
      const distance = Math.max(1, Math.hypot(dx, dy))
      const force = (distance - springLength) * 0.02
      positions[source].vx += (dx / distance) * force
      positions[source].vy += (dy / distance) * force
      positions[target].vx -= (dx / distance) * force
      positions[target].vy -= (dy / distance) * force
    }
    for (const point of positions) {
      point.vx += (WIDTH / 2 - point.x) * 0.004
      point.vy += (HEIGHT / 2 - point.y) * 0.004
      point.x = Math.min(WIDTH - 30, Math.max(30, point.x + point.vx * cooling * 0.5))
      point.y = Math.min(HEIGHT - 30, Math.max(30, point.y + point.vy * cooling * 0.5))
      point.vx *= 0.6
      point.vy *= 0.6
    }
  }
  return positions
}

export default function RelationshipGraph({ graph }) {
  const [selected, setSelected] = useState(null)
  const [hoveredEdge, setHoveredEdge] = useState(null)
  const [zoom, setZoom] = useState(1)

  const nodes = useMemo(() => graph?.nodes || [], [graph])
  const edges = useMemo(() => graph?.edges || [], [graph])
  const positions = useMemo(() => runForceLayout(nodes, edges), [nodes, edges])
  const positionById = useMemo(() => new Map(nodes.map((node, position) => [node.id, positions[position]])), [nodes, positions])

  const neighbors = useMemo(() => {
    if (!selected) return null
    const set = new Set([selected])
    for (const edge of edges) {
      if (edge.source === selected) set.add(edge.target)
      if (edge.target === selected) set.add(edge.source)
    }
    return set
  }, [selected, edges])

  if (!nodes.length) {
    return <div className="chat-empty-state"><span>No relationships were found in the selected documents.</span></div>
  }

  const radius = node => Math.min(22, 7 + Math.sqrt(node.weight || 1) * 3)
  const dimmed = id => neighbors && !neighbors.has(id)
  const selectedNode = nodes.find(node => node.id === selected)
  const selectedEdges = selected ? edges.filter(edge => edge.source === selected || edge.target === selected) : []
  const viewWidth = WIDTH / zoom
  const viewHeight = HEIGHT / zoom

  return (
    <div className="relationship-graph">
      <div className="relationship-graph-toolbar">
        <div className="relationship-legend">
          {Object.entries(TYPE_COLORS).filter(([type]) => nodes.some(node => node.type === type)).map(([type, color]) => (
            <span key={type} className="relationship-legend-item"><i style={{ background: color }} />{type}</span>
          ))}
        </div>
        <div className="relationship-graph-actions">
          <button type="button" className="btn btn-ghost" onClick={() => setZoom(value => Math.min(2.5, value * 1.25))} aria-label="Zoom in">+</button>
          <button type="button" className="btn btn-ghost" onClick={() => setZoom(value => Math.max(0.6, value / 1.25))} aria-label="Zoom out">−</button>
          <button type="button" className="btn btn-ghost" onClick={() => { setZoom(1); setSelected(null) }}>Reset</button>
        </div>
      </div>
      <svg
        className="relationship-canvas"
        viewBox={`${(WIDTH - viewWidth) / 2} ${(HEIGHT - viewHeight) / 2} ${viewWidth} ${viewHeight}`}
        role="img"
        aria-label={`Relationship map with ${nodes.length} nodes and ${edges.length} links`}
        onClick={() => setSelected(null)}
      >
        {edges.map((edge, index) => {
          const source = positionById.get(edge.source)
          const target = positionById.get(edge.target)
          if (!source || !target) return null
          const highlighted = selected && (edge.source === selected || edge.target === selected)
          return (
            <g key={`${edge.source}-${edge.target}-${index}`}>
              <line
                x1={source.x} y1={source.y} x2={target.x} y2={target.y}
                className={`relationship-edge${highlighted ? ' highlighted' : ''}${selected && !highlighted ? ' dimmed' : ''}`}
                onMouseEnter={() => setHoveredEdge(index)}
                onMouseLeave={() => setHoveredEdge(null)}
              />
              {(hoveredEdge === index || highlighted) && (
                <text x={(source.x + target.x) / 2} y={(source.y + target.y) / 2 - 4} className="relationship-edge-label" textAnchor="middle">{edge.label}</text>
              )}
            </g>
          )
        })}
        {nodes.map(node => {
          const point = positionById.get(node.id)
          return (
            <g
              key={node.id}
              transform={`translate(${point.x}, ${point.y})`}
              className={`relationship-node${dimmed(node.id) ? ' dimmed' : ''}${selected === node.id ? ' selected' : ''}`}
              onClick={event => { event.stopPropagation(); setSelected(current => (current === node.id ? null : node.id)) }}
            >
              <circle r={radius(node)} fill={TYPE_COLORS[node.type] || TYPE_COLORS.other} />
              <text y={radius(node) + 12} textAnchor="middle">{node.label.length > 22 ? `${node.label.slice(0, 21)}…` : node.label}</text>
            </g>
          )
        })}
      </svg>
      <div className="relationship-details">
        {selectedNode ? (
          <>
            <strong>{selectedNode.label}</strong>
            <span className="chat-muted"> · {selectedNode.type} · appears in {selectedNode.documentIds.length} document{selectedNode.documentIds.length === 1 ? '' : 's'}</span>
            <ul>
              {selectedEdges.slice(0, 12).map((edge, index) => {
                const otherId = edge.source === selected ? edge.target : edge.source
                const other = nodes.find(node => node.id === otherId)
                return <li key={index}>{edge.source === selected ? `${edge.label} → ${other?.label}` : `${other?.label} ${edge.label} →`}</li>
              })}
            </ul>
          </>
        ) : (
          <span className="chat-muted">
            {nodes.length} nodes · {edges.length} links{graph.sharedEntities?.length ? ` · shared across documents: ${graph.sharedEntities.slice(0, 6).join(', ')}` : ''}. Click a node to focus its relationships.
          </span>
        )}
      </div>
    </div>
  )
}
