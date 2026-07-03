import React, { useState } from 'react'
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
  const [draggingHandle, setDraggingHandle] = useState<'start' | 'end' | 'body' | null>(null)
  const [dragOrigin, setDragOrigin] = useState({ x: 0, y: 0 })
  const [wallOrigin, setWallOrigin] = useState<{ start: typeof start; end: typeof end } | null>(null)

  const handleRadius = 6 / zoom
  const hitWidth = Math.max(thicknessMm, 10 / zoom)

  const onHandleMouseDown = (handle: 'start' | 'end' | 'body', e: React.MouseEvent) => {
    e.stopPropagation()
    setDraggingHandle(handle)
    setDragOrigin({ x: e.clientX, y: e.clientY })
    setWallOrigin({ start: { ...start }, end: { ...end } })
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!draggingHandle || !wallOrigin) return
    const dx = (e.clientX - dragOrigin.x) / zoom
    const dy = (e.clientY - dragOrigin.y) / zoom
    if (draggingHandle === 'start') {
      onUpdate({ start: { x: wallOrigin.start.x + dx, y: wallOrigin.start.y + dy } })
    } else if (draggingHandle === 'end') {
      onUpdate({ end: { x: wallOrigin.end.x + dx, y: wallOrigin.end.y + dy } })
    } else {
      onUpdate({
        start: { x: wallOrigin.start.x + dx, y: wallOrigin.start.y + dy },
        end: { x: wallOrigin.end.x + dx, y: wallOrigin.end.y + dy },
      })
    }
  }

  const onMouseUp = () => setDraggingHandle(null)

  return (
    <g
      onMouseMove={draggingHandle ? onMouseMove : undefined}
      onMouseUp={draggingHandle ? onMouseUp : undefined}
      onMouseLeave={draggingHandle ? onMouseUp : undefined}
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
