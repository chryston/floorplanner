import React, { useCallback, useRef } from 'react'
import { useStore } from '../../store/store'
import { renderShape } from '../../utils/renderShape'
import { snapPoint, snapValue } from '../../utils/geometry'
import type { AnyObject } from '../../types'
import { isFloorObject } from '../../types'

const HANDLE_SIZE = 8

type HandleDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

interface Props {
  object: AnyObject
  isSelected: boolean
  svgRef: React.RefObject<SVGSVGElement | null>
  zoom: number
  snapSpacingMm: number
}

function getSvgScale(svgEl: SVGSVGElement): number {
  const rect = svgEl.getBoundingClientRect()
  const viewBox = svgEl.viewBox.baseVal
  if (!viewBox || viewBox.width === 0) return 1
  return viewBox.width / rect.width
}

export function PlacedObject({ object, isSelected, svgRef, zoom, snapSpacingMm }: Props) {
  const updateObject = useStore(s => s.updateObject)
  const selectObject = useStore(s => s.selectObject)

  // Only FloorObjects are rendered as placed objects
  if (!isFloorObject(object)) {
    return null
  }

  const { id, x, y, width, depth, rotation, name, locked } = object

  const cx = x + width / 2
  const cy = y + depth / 2

  const dragStart = useRef<{ mx: number; my: number; ox: number; oy: number } | null>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (locked) return
    e.stopPropagation()
    selectObject(id)
    const svg = svgRef.current
    if (!svg) return
    const scale = getSvgScale(svg) / zoom
    dragStart.current = { mx: e.clientX * scale, my: e.clientY * scale, ox: x, oy: y }

    const onMove = (mv: MouseEvent) => {
      if (!dragStart.current) return
      const dx = mv.clientX * scale - dragStart.current.mx
      const dy = mv.clientY * scale - dragStart.current.my
      const rawX = dragStart.current.ox + dx
      const rawY = dragStart.current.oy + dy
      const snapped = mv.altKey ? { x: rawX, y: rawY } : snapPoint({ x: rawX, y: rawY }, snapSpacingMm)
      updateObject(id, { x: snapped.x, y: snapped.y })
    }
    const onUp = () => {
      dragStart.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [id, x, y, locked, zoom, svgRef, updateObject, selectObject, snapSpacingMm])

  // Projects mouse deltas into object-local (unrotated) space before modifying width/depth
  const makeResizeHandler = useCallback((dir: HandleDir) => (e: React.MouseEvent) => {
    if (locked) return
    e.stopPropagation()
    const svg = svgRef.current
    if (!svg) return
    const scale = getSvgScale(svg) / zoom
    let startX = e.clientX * scale
    let startY = e.clientY * scale
    let currentW = width
    let currentD = depth
    let currentX = x
    let currentY = y
    const rad = (rotation * Math.PI) / 180
    const cos = Math.cos(-rad)
    const sin = Math.sin(-rad)

    const onMove = (mv: MouseEvent) => {
      const rawDx = mv.clientX * scale - startX
      const rawDy = mv.clientY * scale - startY
      startX = mv.clientX * scale
      startY = mv.clientY * scale

      // Project into object-local coordinate system
      const localDx = rawDx * cos - rawDy * sin
      const localDy = rawDx * sin + rawDy * cos

      let newW = currentW
      let newD = currentD
      let newX = currentX
      let newY = currentY

      if (dir.includes('e')) newW = Math.max(10, newW + localDx)
      if (dir.includes('s')) newD = Math.max(10, newD + localDy)
      if (dir.includes('w')) { newW = Math.max(10, newW - localDx); newX = currentX + (currentW - newW) }
      if (dir.includes('n')) { newD = Math.max(10, newD - localDy); newY = currentY + (currentD - newD) }

      currentW = newW
      currentD = newD
      currentX = newX
      currentY = newY

      const snappedW = mv.altKey ? newW : snapValue(newW, snapSpacingMm)
      const snappedD = mv.altKey ? newD : snapValue(newD, snapSpacingMm)
      const snappedX = mv.altKey ? newX : snapValue(newX, snapSpacingMm)
      const snappedY = mv.altKey ? newY : snapValue(newY, snapSpacingMm)

      updateObject(id, { width: snappedW, depth: snappedD, x: snappedX, y: snappedY })
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [id, x, y, width, depth, rotation, locked, zoom, svgRef, updateObject, snapSpacingMm])

  const hs = HANDLE_SIZE / zoom
  const handlePositions: Record<HandleDir, [number, number]> = {
    n:  [cx,          y],
    s:  [cx,          y + depth],
    e:  [x + width,   cy],
    w:  [x,           cy],
    ne: [x + width,   y],
    nw: [x,           y],
    se: [x + width,   y + depth],
    sw: [x,           y + depth],
  }

  return (
    <g
      transform={`rotate(${rotation}, ${cx}, ${cy})`}
      onMouseDown={handleMouseDown}
      style={{ cursor: locked ? 'default' : 'move' }}
      data-object-id={id}
    >
      {/* Shape rendered in local space, translated to (x, y) */}
      <g transform={`translate(${x}, ${y})`}>
        {renderShape(object)}
      </g>

      {/* Object name label */}
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={Math.max(10, Math.min(14, Math.min(width, depth) / 4)) / zoom}
        fill="#f5f5f7"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {name}
      </text>

      {/* Selection ring — pointer-events:none, no data-object-id */}
      {isSelected && (
        <rect
          x={x - 2 / zoom}
          y={y - 2 / zoom}
          width={width + 4 / zoom}
          height={depth + 4 / zoom}
          fill="none"
          stroke="#0a84ff"
          strokeWidth={2 / zoom}
          strokeDasharray={`${4 / zoom},${2 / zoom}`}
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* Resize handles */}
      {isSelected && !locked && (Object.entries(handlePositions) as [HandleDir, [number, number]][]).map(([dir, [hx, hy]]) => (
        <rect
          key={dir}
          data-handle={dir}
          x={hx - hs / 2}
          y={hy - hs / 2}
          width={hs}
          height={hs}
          fill="white"
          stroke="#0a84ff"
          strokeWidth={1 / zoom}
          style={{ cursor: `${dir}-resize` }}
          onMouseDown={makeResizeHandler(dir)}
        />
      ))}
    </g>
  )
}
