import React from 'react'
import type { FloorObject } from '../types'

// Build a polygon points string for a regular n-gon centered at (cx, cy)
function nGonPoints(cx: number, cy: number, rx: number, ry: number, n: number, offsetAngle = 0): string {
  return Array.from({ length: n }, (_, i) => {
    const angle = (2 * Math.PI * i) / n + offsetAngle
    const x = cx + rx * Math.cos(angle)
    const y = cy + ry * Math.sin(angle)
    return `${x},${y}`
  }).join(' ')
}

export function renderShape(obj: FloorObject): React.ReactElement {
  const { shapeType, width: w, depth: d, fill = '#60a5fa', stroke = '#2563eb' } = obj
  const sharedProps = { fill, stroke, strokeWidth: 1 }

  switch (shapeType) {
    case 'rectangle':
    case 'square':
      return React.createElement('rect', { ...sharedProps, x: 0, y: 0, width: w, height: d })

    case 'circle': {
      const r = w / 2
      return React.createElement('circle', { ...sharedProps, cx: w / 2, cy: d / 2, r })
    }

    case 'ellipse':
      return React.createElement('ellipse', { ...sharedProps, cx: w / 2, cy: d / 2, rx: w / 2, ry: d / 2 })

    case 'semicircle': {
      // Flat side at bottom, arc at top, centered horizontally
      const r = w / 2
      const d_path = `M 0,${d} A ${r},${r} 0 0,1 ${w},${d} Z`
      return React.createElement('path', { ...sharedProps, d: d_path })
    }

    case 'quadrant': {
      // Quarter circle, corner at top-left, arc goes to bottom-right
      const r = Math.min(w, d)
      const d_path = `M 0,0 L ${w},0 A ${r},${r} 0 0,1 0,${d} Z`
      return React.createElement('path', { ...sharedProps, d: d_path })
    }

    case 'triangle': {
      // Isoceles triangle: apex top-center, base at bottom
      const points = `${w / 2},0 ${w},${d} 0,${d}`
      return React.createElement('polygon', { ...sharedProps, points })
    }

    case 'right-triangle': {
      // Right angle at bottom-left
      const points = `0,0 ${w},${d} 0,${d}`
      return React.createElement('polygon', { ...sharedProps, points })
    }

    case 'wall':
      return React.createElement('line', {
        stroke,
        strokeWidth: Math.max(2, d),
        strokeLinecap: 'round',
        x1: 0,
        y1: d / 2,
        x2: w,
        y2: d / 2,
      })

    case 'L-shape': {
      // L shape occupying full w×d bounding box, arm thickness = 1/3 of shorter side
      const t = Math.min(w, d) / 3
      const points = `0,0 ${t},0 ${t},${d - t} ${w},${d - t} ${w},${d} 0,${d}`
      return React.createElement('polygon', { ...sharedProps, points })
    }

    case 'U-shape': {
      // U shape: two vertical arms and a horizontal base
      const t = Math.min(w, d) / 4
      const points = `0,0 ${t},0 ${t},${d - t} ${w - t},${d - t} ${w - t},0 ${w},0 ${w},${d} 0,${d}`
      return React.createElement('polygon', { ...sharedProps, points })
    }

    case 'pentagon':
      return React.createElement('polygon', {
        ...sharedProps,
        // Flat-bottom orientation: rotate by -π/2 so apex is at top
        points: nGonPoints(w / 2, d / 2, w / 2, d / 2, 5, -Math.PI / 2),
      })

    case 'hexagon':
      return React.createElement('polygon', {
        ...sharedProps,
        points: nGonPoints(w / 2, d / 2, w / 2, d / 2, 6, 0),
      })

    case 'octagon':
      return React.createElement('polygon', {
        ...sharedProps,
        points: nGonPoints(w / 2, d / 2, w / 2, d / 2, 8, -Math.PI / 8),
      })

    default:
      // Exhaustiveness check
      return React.createElement('rect', { ...sharedProps, x: 0, y: 0, width: w, height: d })
  }
}
