import React from 'react'
import type { WallSegment } from '../../types'

interface Props {
  wall: WallSegment
  selected: boolean
  zoom: number
  onSelect: () => void
  onUpdate: (patch: Partial<WallSegment>) => void
}

export function WallSegmentRenderer({ wall, selected, zoom, onSelect, onUpdate }: Props) {
  const { start, end, thicknessMm, fill, stroke } = wall

  const handleRadius = 6 / zoom
  const hitWidth = Math.max(thicknessMm, 10 / zoom)

  const onHandleMouseDown = (handle: 'start' | 'end' | 'body', e: React.MouseEvent) => {
    e.stopPropagation()
    const origin = { x: e.clientX, y: e.clientY }
    const wallStart = { ...wall.start }
    const wallEnd = { ...wall.end }

    const onMove = (mv: MouseEvent) => {
      const dx = (mv.clientX - origin.x) / zoom
      const dy = (mv.clientY - origin.y) / zoom
      if (handle === 'start') {
        onUpdate({ start: { x: wallStart.x + dx, y: wallStart.y + dy } })
      } else if (handle === 'end') {
        onUpdate({ end: { x: wallEnd.x + dx, y: wallEnd.y + dy } })
      } else {
        onUpdate({
          start: { x: wallStart.x + dx, y: wallStart.y + dy },
          end: { x: wallEnd.x + dx, y: wallEnd.y + dy },
        })
      }
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <g
    >
      {/* Wide transparent hit area for selection and body drag */}
      <line
        x1={start.x} y1={start.y} x2={end.x} y2={end.y}
        stroke="transparent"
        strokeWidth={hitWidth}
        style={{ cursor: 'move' }}
        onClick={onSelect}
        onMouseDown={e => onHandleMouseDown('body', e)}
      />
      {/* Wall body */}
      <line
        x1={start.x} y1={start.y} x2={end.x} y2={end.y}
        stroke={stroke ?? '#555'}
        strokeWidth={thicknessMm}
        strokeLinecap="square"
        fill={fill ?? 'none'}
        style={{ pointerEvents: 'none' }}
      />
      {/* Endpoint handles (shown when selected) */}
      {selected && (
        <>
          <circle
            cx={start.x} cy={start.y} r={handleRadius}
            fill="white" stroke="#0078d4" strokeWidth={1.5 / zoom}
            style={{ cursor: 'crosshair' }}
            onMouseDown={e => onHandleMouseDown('start', e)}
          />
          <circle
            cx={end.x} cy={end.y} r={handleRadius}
            fill="white" stroke="#0078d4" strokeWidth={1.5 / zoom}
            style={{ cursor: 'crosshair' }}
            onMouseDown={e => onHandleMouseDown('end', e)}
          />
        </>
      )}
    </g>
  )
}
