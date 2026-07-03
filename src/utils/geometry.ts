
export type Point = { x: number; y: number }

export function distance(a: Point, b: Point): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2)
}

export function angleBetween(a: Point, b: Point): number {
  return Math.atan2(b.y - a.y, b.x - a.x)
}

export function projectPointToSegment(
  point: Point,
  start: Point,
  end: Point,
): Point & { t: number } {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const len2 = dx * dx + dy * dy
  if (len2 === 0) return { ...start, t: 0 }
  const t = clamp(
    ((point.x - start.x) * dx + (point.y - start.y) * dy) / len2,
    0,
    1,
  )
  return { x: start.x + t * dx, y: start.y + t * dy, t }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function pointAlongSegment(start: Point, end: Point, offsetMm: number): Point {
  const len = distance(start, end)
  if (len === 0) return { ...start }
  const t = offsetMm / len
  return { x: start.x + t * (end.x - start.x), y: start.y + t * (end.y - start.y) }
}

export function snapValue(value: number, spacing: number): number {
  if (spacing <= 0) return value
  return Math.round(value / spacing) * spacing
}

export function snapPoint(point: Point, spacing: number): Point {
  return { x: snapValue(point.x, spacing), y: snapValue(point.y, spacing) }
}

export function formatDistance(mm: number): string {
  if (mm < 1000) return `${Math.round(mm)} mm`
  return `${(mm / 1000).toFixed(2)} m`
}

export function constrainAngle(start: Point, end: Point, stepDeg: number): Point {
  const angle = angleBetween(start, end)
  const len = distance(start, end)
  const step = (stepDeg * Math.PI) / 180
  const snapped = Math.round(angle / step) * step
  return { x: start.x + len * Math.cos(snapped), y: start.y + len * Math.sin(snapped) }
}
