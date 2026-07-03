import { formatDistance } from '../../utils/geometry'
import type { FloorObject } from '../../types'

interface Props {
  obj: FloorObject
  zoom: number
}

export function DimensionLabel({ obj, zoom }: Props) {
  const cx = obj.x + obj.width / 2
  const cy = obj.y + obj.depth / 2
  const labelW = formatDistance(obj.width)
  const labelD = formatDistance(obj.depth)
  const line1 = `${labelW} × ${labelD}`
  const line2 = obj.rotation !== 0 ? `${obj.rotation.toFixed(0)}°` : null
  const fontSize = 14 / zoom

  return (
    <g style={{ pointerEvents: 'none' }}>
      <text
        x={cx}
        y={cy - (line2 ? fontSize * 0.7 : 0)}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={fontSize}
        fill="#1a1a1a"
        stroke="white"
        strokeWidth={fontSize * 0.15}
        paintOrder="stroke"
      >
        {line1}
      </text>
      {line2 && (
        <text
          x={cx}
          y={cy + fontSize * 0.9}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={fontSize * 0.85}
          fill="#555"
          stroke="white"
          strokeWidth={fontSize * 0.12}
          paintOrder="stroke"
        >
          {line2}
        </text>
      )}
    </g>
  )
}
