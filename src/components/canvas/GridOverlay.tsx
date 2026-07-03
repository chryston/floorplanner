import type { GridSettings } from '../../types'

interface Props {
  grid: GridSettings
  zoom: number
  panX: number
  panY: number
  svgWidth: number
  svgHeight: number
}

export function GridOverlay({ grid, zoom, panX, panY, svgWidth, svgHeight }: Props) {
  if (!grid.enabled) return null

  const minorPx = grid.minorSpacingMm * zoom
  const majorPx = grid.majorSpacingMm * zoom
  const minorOx = ((panX % minorPx) + minorPx) % minorPx
  const minorOy = ((panY % minorPx) + minorPx) % minorPx
  const majorOx = ((panX % majorPx) + majorPx) % majorPx
  const majorOy = ((panY % majorPx) + majorPx) % majorPx

  return (
    <g style={{ pointerEvents: 'none' }}>
      <defs>
        {grid.showMinor && (
          <pattern
            id="fp-grid-minor"
            x={minorOx}
            y={minorOy}
            width={minorPx}
            height={minorPx}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${minorPx} 0 L 0 0 0 ${minorPx}`}
              fill="none"
              stroke="#d0d0d0"
              strokeWidth={0.5}
            />
          </pattern>
        )}
        {grid.showMajor && (
          <pattern
            id="fp-grid-major"
            x={majorOx}
            y={majorOy}
            width={majorPx}
            height={majorPx}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${majorPx} 0 L 0 0 0 ${majorPx}`}
              fill="none"
              stroke="#a0a0a0"
              strokeWidth={1}
            />
          </pattern>
        )}
      </defs>
      {grid.showMinor && (
        <rect width={svgWidth} height={svgHeight} fill="url(#fp-grid-minor)" />
      )}
      {grid.showMajor && (
        <rect width={svgWidth} height={svgHeight} fill="url(#fp-grid-major)" />
      )}
    </g>
  )
}
