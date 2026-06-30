import React from 'react'

interface CalibrationPoint {
  svgX: number
  svgY: number
  screenX: number
  screenY: number
}

interface Props {
  svgRef: React.RefObject<SVGSVGElement | null>
  onCalibrationClick: (point: CalibrationPoint) => void
}

export function CalibrationOverlay({ svgRef, onCalibrationClick }: Props) {
  const handleClick = (e: React.MouseEvent<SVGRectElement>) => {
    const svg = svgRef.current
    if (!svg) return
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const svgPt = pt.matrixTransform(svg.getScreenCTM()!.inverse())
    onCalibrationClick({
      svgX: svgPt.x,
      svgY: svgPt.y,
      screenX: e.clientX,
      screenY: e.clientY,
    })
  }

  return (
    <rect
      x={-9999}
      y={-9999}
      width={99999}
      height={99999}
      fill="transparent"
      style={{ cursor: 'crosshair' }}
      onClick={handleClick}
    />
  )
}
