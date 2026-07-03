import { distance, formatDistance } from './geometry'
import { isDimensionAnnotation } from '../types'
import type { AnyObject } from '../types'

export function exportSVGBlob(svgEl: SVGSVGElement): Blob {
  const serializer = new XMLSerializer()
  const source = serializer.serializeToString(svgEl)
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
