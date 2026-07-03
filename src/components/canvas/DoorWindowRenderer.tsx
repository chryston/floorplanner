import { pointAlongSegment, angleBetween } from '../../utils/geometry'
import type { DoorObject, WindowObject, WallSegment } from '../../types'

function getTransform(wall: WallSegment, offsetMm: number, widthMm: number) {
  const pos = pointAlongSegment(wall.start, wall.end, offsetMm + widthMm / 2)
  const angleDeg = (angleBetween(wall.start, wall.end) * 180) / Math.PI
  return { cx: pos.x, cy: pos.y, angleDeg }
}

interface DoorProps {
  door: DoorObject
  wall: WallSegment
  selected: boolean
  zoom: number
  onSelect: () => void
}

export function DoorRenderer({ door, wall, selected, zoom, onSelect }: DoorProps) {
  const { cx, cy, angleDeg } = getTransform(wall, door.offsetMm, door.widthMm)
  const w = door.widthMm
  const swingSide = door.swingDirection === 'left' ? -1 : 1
  const swingRad = (door.swingAngleDeg * Math.PI) / 180
  const strokeW = 1.5 / zoom
  const hx = -w / 2

  // Leaf tip is at (w/2, 0); arc sweeps from tip back to hinge-side
  const arcEndX = hx + w * Math.cos(swingRad * swingSide)
  const arcEndY = w * Math.sin(swingRad * swingSide)
  // sweep-flag: 0 = counterclockwise (+y in SVG = down), 1 = clockwise
  const sweepFlag = swingSide > 0 ? 0 : 1

  return (
    <g
      transform={`translate(${cx}, ${cy}) rotate(${angleDeg})`}
      style={{ cursor: 'pointer' }}
      onClick={e => { e.stopPropagation(); onSelect() }}
    >
      {/* Transparent hit area */}
      <rect x={-w / 2} y={-w / 2} width={w} height={w} fill="transparent" />
      {/* Door leaf */}
      <line
        x1={hx} y1={0}
        x2={w / 2} y2={0}
        stroke={selected ? '#0078d4' : '#555'}
        strokeWidth={strokeW * 2}
      />
      {/* Swing arc */}
      <path
        d={`M ${w / 2} 0 A ${w} ${w} 0 0 ${sweepFlag} ${arcEndX} ${arcEndY}`}
        fill="none"
        stroke={selected ? '#0078d4' : '#888'}
        strokeWidth={strokeW}
        strokeDasharray={`${6 / zoom} ${3 / zoom}`}
      />
    </g>
  )
}

interface WindowProps {
  win: WindowObject
  wall: WallSegment
  selected: boolean
  zoom: number
  onSelect: () => void
}

export function WindowRenderer({ win, wall, selected, zoom, onSelect }: WindowProps) {
  const { cx, cy, angleDeg } = getTransform(wall, win.offsetMm, win.widthMm)
  const w = win.widthMm
  const thickness = wall.thicknessMm
  const strokeW = 1.5 / zoom

  return (
    <g
      transform={`translate(${cx}, ${cy}) rotate(${angleDeg})`}
      style={{ cursor: 'pointer' }}
      onClick={e => { e.stopPropagation(); onSelect() }}
    >
      {/* Transparent hit area */}
      <rect x={-w / 2} y={-thickness / 2} width={w} height={thickness} fill="transparent" />
      {/* White fill to cover wall behind window */}
      <rect
        x={-w / 2} y={-thickness / 2}
        width={w} height={thickness}
        fill="white"
        stroke={selected ? '#0078d4' : '#555'}
        strokeWidth={strokeW}
      />
      {/* Glass centre line */}
      <line
        x1={0} y1={-thickness / 2}
        x2={0} y2={thickness / 2}
        stroke={selected ? '#0078d4' : '#88bbdd'}
        strokeWidth={strokeW}
      />
    </g>
  )
}
