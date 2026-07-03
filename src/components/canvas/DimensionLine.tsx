import { distance, formatDistance } from '../../utils/geometry'
import type { DimensionAnnotation } from '../../types'

interface Props {
  dim: DimensionAnnotation
  selected: boolean
  zoom: number
  onSelect: () => void
}

export function DimensionLine({ dim, selected, zoom, onSelect }: Props) {
  const { start, end } = dim
  const mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 }
  const len = distance(start, end)
  const label = formatDistance(len)
  const angle = Math.atan2(end.y - start.y, end.x - start.x)
  const tickLen = 8 / zoom
  const fontSize = 12 / zoom
  const strokeW = 1.5 / zoom

  const tickSx = Math.cos(angle + Math.PI / 2) * tickLen
  const tickSy = Math.sin(angle + Math.PI / 2) * tickLen

  const color = selected ? '#0078d4' : '#333'

  return (
    <g
      style={{ cursor: 'pointer', pointerEvents: 'all' }}
      onClick={onSelect}
    >
      {/* Invisible wide hit area */}
      <line
        x1={start.x} y1={start.y} x2={end.x} y2={end.y}
        stroke="transparent" strokeWidth={12 / zoom}
      />
      {/* Dimension line */}
      <line
        x1={start.x} y1={start.y} x2={end.x} y2={end.y}
        stroke={color}
        strokeWidth={strokeW}
        markerEnd="url(#dim-arrow)"
        markerStart="url(#dim-arrow)"
      />
      {/* Tick at start */}
      <line
        x1={start.x - tickSx} y1={start.y - tickSy}
        x2={start.x + tickSx} y2={start.y + tickSy}
        stroke={color} strokeWidth={strokeW}
      />
      {/* Tick at end */}
      <line
        x1={end.x - tickSx} y1={end.y - tickSy}
        x2={end.x + tickSx} y2={end.y + tickSy}
        stroke={color} strokeWidth={strokeW}
      />
      {/* Label background */}
      <rect
        x={mid.x - (label.length * fontSize * 0.3)}
        y={mid.y - fontSize * 0.75}
        width={label.length * fontSize * 0.6}
        height={fontSize * 1.4}
        fill="white"
        fillOpacity={0.85}
        rx={2 / zoom}
      />
      {/* Label text */}
      <text
        x={mid.x} y={mid.y}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={fontSize}
        fill={selected ? '#0078d4' : '#111'}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {label}
      </text>
    </g>
  )
}
