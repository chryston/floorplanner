import { distance, formatDistance, pointAlongSegment, angleBetween } from './geometry'
import { isDimensionAnnotation, isWallSegment, isDoorObject, isWindowObject } from '../types'
import type { AnyObject } from '../types'

export function exportSVGBlob(svgEl: SVGSVGElement): Blob {
  const clone = svgEl.cloneNode(true) as SVGSVGElement
  clone.querySelectorAll('[data-no-export="true"]').forEach(el => el.remove())
  const serializer = new XMLSerializer()
  const source = serializer.serializeToString(clone)
  const svgBlob = new Blob(
    ['<?xml version="1.0" standalone="no"?>\r\n', source],
    { type: 'image/svg+xml;charset=utf-8' }
  )
  return svgBlob
}

export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** Generate SVG markup for dimension annotation objects (for standalone export). */
export function exportDimensionAnnotationsSVG(objects: AnyObject[]): string {
  let svg = ''
  for (const obj of objects) {
    if (isWallSegment(obj)) {
      svg += `<line x1="${obj.start.x}" y1="${obj.start.y}" x2="${obj.end.x}" y2="${obj.end.y}" stroke="${obj.stroke ?? '#555'}" stroke-width="${obj.thicknessMm}" stroke-linecap="square"/>\n`
    }
    if (isDoorObject(obj)) {
      // find parent wall from objects list
      const wall = objects.find(o => isWallSegment(o) && o.id === obj.wallId)
      if (wall && isWallSegment(wall)) {
        const pos = pointAlongSegment(wall.start, wall.end, obj.offsetMm + obj.widthMm / 2)
        const angleDeg = (angleBetween(wall.start, wall.end) * 180) / Math.PI
        const w = obj.widthMm
        const swingSide = obj.swingDirection === 'left' ? -1 : 1
        const swingRad = (obj.swingAngleDeg * Math.PI) / 180
        const hx = -w / 2
        const arcEndX = hx + w * Math.cos(swingRad)
        const arcEndY = w * Math.sin(swingRad) * swingSide
        const sweepFlag = swingSide > 0 ? 0 : 1
        svg += `<g transform="translate(${pos.x},${pos.y}) rotate(${angleDeg})">\n`
        svg += `  <line x1="${hx}" y1="0" x2="${w / 2}" y2="0" stroke="#555" stroke-width="3"/>\n`
        svg += `  <path d="M ${w / 2} 0 A ${w} ${w} 0 0 ${sweepFlag} ${arcEndX} ${arcEndY}" fill="none" stroke="#888" stroke-width="1.5" stroke-dasharray="6 3"/>\n`
        svg += `</g>\n`
      }
    }
    if (isWindowObject(obj)) {
      const wall = objects.find(o => isWallSegment(o) && o.id === obj.wallId)
      if (wall && isWallSegment(wall)) {
        const pos = pointAlongSegment(wall.start, wall.end, obj.offsetMm + obj.widthMm / 2)
        const angleDeg = (angleBetween(wall.start, wall.end) * 180) / Math.PI
        const w = obj.widthMm
        const t = wall.thicknessMm
        svg += `<g transform="translate(${pos.x},${pos.y}) rotate(${angleDeg})">\n`
        svg += `  <rect x="${-w / 2}" y="${-t / 2}" width="${w}" height="${t}" fill="white" stroke="#555" stroke-width="1.5"/>\n`
        svg += `  <line x1="0" y1="${-t / 2}" x2="0" y2="${t / 2}" stroke="#88bbdd" stroke-width="1.5"/>\n`
        svg += `</g>\n`
      }
    }
    if (isDimensionAnnotation(obj)) {
      const { start, end } = obj
      const mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 }
      const label = formatDistance(distance(start, end))
      svg += `<line x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}" stroke="#333" stroke-width="1.5"/>\n`
      svg += `<text x="${mid.x}" y="${mid.y}" text-anchor="middle" dominant-baseline="middle" font-size="12" fill="#111">${label}</text>\n`
    }
  }
  return svg
}
