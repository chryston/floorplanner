import React, { useRef, useCallback, useState } from 'react'
import { useStore, activeLayout } from '../../store/store'
import { CalibrationOverlay } from './CalibrationOverlay'
import { PlacedObject } from './PlacedObject'
import { GridOverlay } from './GridOverlay'
import { DimensionLabel } from './DimensionLabel'
import type { ActiveTool } from '../../types'
import { isFloorObject, isDimensionAnnotation, isWallSegment } from '../../types'
import { DimensionLine } from './DimensionLine'
import { WallSegmentRenderer } from './WallSegmentRenderer'

const MIN_ZOOM = 0.1
const MAX_ZOOM = 5
const ZOOM_SENSITIVITY = 0.001

interface Props {
  calibrating: boolean
  onCalibrationPoint: (pt: { svgX: number; svgY: number; screenX: number; screenY: number }) => void
  svgRef: React.RefObject<SVGSVGElement | null>
  activeTool: ActiveTool
  onWorldMouseDown?: (worldPt: { x: number; y: number }, e: React.MouseEvent) => void
  onWorldMouseMove?: (worldPt: { x: number; y: number }, e: React.MouseEvent) => void
  onWorldMouseUp?: (worldPt: { x: number; y: number }, e: React.MouseEvent) => void
  drawingPreview?: React.ReactNode
  onZoomChange?: (zoom: number) => void
}

export function FloorPlanCanvas({ calibrating, onCalibrationPoint, svgRef, activeTool, onWorldMouseDown, onWorldMouseMove, onWorldMouseUp, drawingPreview, onZoomChange }: Props) {
  const project = useStore(s => s.project)
  const selectedObjectId = useStore(s => s.selectedObjectId)
  const clearSelection = useStore(s => s.clearSelection)
  const selectObject = useStore(s => s.selectObject)

  const layout = activeLayout(project)
  const canvas = layout.canvas
  const selectedObj = selectedObjectId ? layout.objects.find(o => o.id === selectedObjectId) ?? null : null
  const [zoom, setZoom] = useState(1)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const isPanning = useRef(false)
  const lastPan = useRef({ x: 0, y: 0 })

  const screenToWorld = useCallback((e: React.MouseEvent) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return null
    return {
      x: (e.clientX - rect.left - panX) / zoom,
      y: (e.clientY - rect.top - panY) / zoom,
    }
  }, [svgRef, panX, panY, zoom])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = -e.deltaY * ZOOM_SENSITIVITY
    setZoom(z => {
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z + delta * z))
      onZoomChange?.(next)
      return next
    })
  }, [onZoomChange])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (activeTool !== 'select') {
      if (onWorldMouseDown) {
        const pt = screenToWorld(e)
        if (pt) onWorldMouseDown(pt, e)
      }
      return
    }
    // Middle mouse or alt+left = pan
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      isPanning.current = true
      lastPan.current = { x: e.clientX, y: e.clientY }
      e.preventDefault()
    }
  }, [activeTool, onWorldMouseDown, screenToWorld])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (activeTool !== 'select') {
      if (onWorldMouseMove) {
        const pt = screenToWorld(e)
        if (pt) onWorldMouseMove(pt, e)
      }
      return
    }
    if (!isPanning.current) return
    const dx = e.clientX - lastPan.current.x
    const dy = e.clientY - lastPan.current.y
    lastPan.current = { x: e.clientX, y: e.clientY }
    setPanX(px => px + dx / zoom)
    setPanY(py => py + dy / zoom)
  }, [activeTool, onWorldMouseMove, screenToWorld, zoom])

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (activeTool !== 'select') {
      if (onWorldMouseUp) {
        const pt = screenToWorld(e)
        if (pt) onWorldMouseUp(pt, e)
      }
      return
    }
    isPanning.current = false
  }, [activeTool, onWorldMouseUp, screenToWorld])

  const handleMouseLeave = useCallback(() => {
    isPanning.current = false
  }, [])

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as SVGElement).dataset.objectId) return
    clearSelection()
  }, [clearSelection])

  const imgW = canvas.image && canvas.pixelsPerMm
    ? canvas.image.widthPx / canvas.pixelsPerMm
    : 800
  const imgH = canvas.image && canvas.pixelsPerMm
    ? canvas.image.heightPx / canvas.pixelsPerMm
    : 600

  const visibleLayerIds = new Set(layout.layers.filter(l => l.visible).map(l => l.id))
  const sortedObjects = [...layout.objects]
    .filter(o => o.visible !== false && (o.layerId === undefined || visibleLayerIds.has(o.layerId)))
    .sort((a, b) => {
      const la = layout.layers.find(l => l.id === a.layerId)?.order ?? 0
      const lb = layout.layers.find(l => l.id === b.layerId)?.order ?? 0
      return la - lb
    })

  return (
    <svg
      ref={svgRef}
      className="w-full h-full"
      style={{ cursor: calibrating ? 'crosshair' : activeTool !== 'select' ? 'crosshair' : isPanning.current ? 'grabbing' : 'default' }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onClick={handleCanvasClick}
    >
      <defs>
        <marker
          id="dim-arrow"
          markerWidth={8}
          markerHeight={8}
          refX={4}
          refY={4}
          orient="auto"
        >
          <path d="M 0 0 L 8 4 L 0 8 Z" fill="#555" />
        </marker>
      </defs>

      <GridOverlay
        grid={canvas.grid}
        zoom={zoom}
        panX={panX}
        panY={panY}
        svgWidth={9999}
        svgHeight={9999}
      />

      <g transform={`translate(${panX},${panY}) scale(${zoom})`}>
        {/* Background / image */}
        {canvas.image ? (
          <image
            href={canvas.image.dataUrl}
            x={0}
            y={0}
            width={imgW}
            height={imgH}
            style={{ pointerEvents: 'none' }}
          />
        ) : (
          <rect
            x={0}
            y={0}
            width={imgW}
            height={imgH}
            fill="#2c2c2e"
            stroke="#38383a"
            strokeWidth={1}
          />
        )}

        {/* Objects */}
        {sortedObjects.map(obj => (
          <PlacedObject
            key={obj.id}
            object={obj}
            isSelected={obj.id === selectedObjectId}
            svgRef={svgRef}
            zoom={zoom}
            snapSpacingMm={canvas.snap.enabled ? canvas.snap.spacingMm : 0}
          />
        ))}

        {/* Wall segments */}
        {layout.objects.filter(isWallSegment).map(wall => (
          <WallSegmentRenderer
            key={wall.id}
            wall={wall}
            selected={selectedObjectId === wall.id}
            zoom={zoom}
            onSelect={() => selectObject(wall.id)}
            onUpdate={patch => useStore.getState().updateObject(wall.id, patch)}
          />
        ))}

        {/* Dimension annotations */}
        {layout.objects.filter(isDimensionAnnotation).map(dim => (
          <DimensionLine
            key={dim.id}
            dim={dim}
            selected={selectedObjectId === dim.id}
            zoom={zoom}
            onSelect={() => selectObject(dim.id)}
          />
        ))}

        {/* Dimension label for selected object */}
        {selectedObj && isFloorObject(selectedObj) && (
          <DimensionLabel obj={selectedObj} zoom={zoom} />
        )}

        {/* Drawing preview (world space) */}
        {drawingPreview}

        {/* Calibration overlay */}
        {calibrating && (
          <CalibrationOverlay svgRef={svgRef} onCalibrationClick={onCalibrationPoint} />
        )}
      </g>
    </svg>
  )
}
