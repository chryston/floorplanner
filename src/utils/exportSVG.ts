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
