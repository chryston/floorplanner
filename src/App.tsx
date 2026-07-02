import React, { useRef, useState, useCallback, useEffect } from 'react'
import { useStore, activeLayout, useTemporalStore } from './store/store'
import { FloorPlanCanvas } from './components/canvas/FloorPlanCanvas'
import { ShapePalette } from './components/sidebar/ShapePalette'
import { LayersPanel } from './components/sidebar/LayersPanel'
import { PropertiesPanel } from './components/properties/PropertiesPanel'
import { Toolbar } from './components/toolbar/Toolbar'
import { ScaleCalibrationModal } from './components/modals/ScaleCalibrationModal'
import { CustomShapeModal } from './components/modals/CustomShapeModal'
import { ImportModal } from './components/modals/ImportModal'
import { loadProject } from './utils/projectIO'

interface CalibrationPoint {
  svgX: number
  svgY: number
  screenX: number
  screenY: number
}

export default function App() {
  const project = useStore(s => s.project)
  const setCanvasImage = useStore(s => s.setCanvasImage)
  const setPixelsPerMm = useStore(s => s.setPixelsPerMm)
  const addObject = useStore(s => s.addObject)
  const updateObject = useStore(s => s.updateObject)
  const importProject = useStore(s => s.importProject)

  const svgRef = useRef<SVGSVGElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [calibrating, setCalibrating] = useState(false)
  const [calibrationPoints, setCalibrationPoints] = useState<CalibrationPoint[]>([])
  const [calibrationDistancePx, setCalibrationDistancePx] = useState<number | null>(null)
  const [showCalibrationModal, setShowCalibrationModal] = useState(false)
  const [showCustomShapeModal, setShowCustomShapeModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)

  // Keyboard shortcuts: Ctrl+Z undo, Ctrl+Y redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        useTemporalStore.getState().undo()
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        useTemporalStore.getState().redo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string
      const img = new Image()
      img.onload = () => {
        setCanvasImage({ dataUrl, widthPx: img.naturalWidth, heightPx: img.naturalHeight })
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
    // Reset file input so same file can be re-uploaded
    e.target.value = ''
  }

  const handleCalibrationPoint = useCallback((pt: CalibrationPoint) => {
    setCalibrationPoints(prev => {
      const next = [...prev, pt]
      if (next.length === 2) {
        const dx = next[1].svgX - next[0].svgX
        const dy = next[1].svgY - next[0].svgY
        const distPx = Math.sqrt(dx * dx + dy * dy)
        setCalibrationDistancePx(distPx)
        setShowCalibrationModal(true)
        setCalibrating(false)
        return []
      }
      return next
    })
  }, [])

  const handleCalibrationConfirm = (realMm: number) => {
    if (calibrationDistancePx !== null && calibrationDistancePx > 0) {
      setPixelsPerMm(calibrationDistancePx / realMm)
    }
    setShowCalibrationModal(false)
    setCalibrationDistancePx(null)
  }

  const handleCustomShapeConfirm = (name: string, width: number, depth: number) => {
    addObject('rectangle')
    const layout = activeLayout(useStore.getState().project)
    const obj = layout.objects[layout.objects.length - 1]
    if (obj) updateObject(obj.id, { name, width, depth })
    setShowCustomShapeModal(false)
  }

  const handleImportConfirm = (importedProject: ReturnType<typeof loadProject>) => {
    importProject(importedProject)
    useTemporalStore.getState().clear()
    setShowImportModal(false)
  }

  void project

  return (
    <div className="flex h-full flex-col bg-surface text-text-primary">
      <Toolbar
        svgRef={svgRef}
        onUploadImage={() => fileInputRef.current?.click()}
        onCalibrate={() => { setCalibrating(true); setCalibrationPoints([]) }}
        onImport={() => setShowImportModal(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar: shape palette + layers */}
        <aside className="w-48 bg-panel border-r border-divider flex flex-col overflow-y-auto shrink-0">
          <ShapePalette onAddCustom={() => setShowCustomShapeModal(true)} />
          <div className="border-t border-divider mt-2" />
          <LayersPanel />
        </aside>

        {/* Canvas */}
        <main className="flex-1 bg-surface overflow-hidden relative">
          {calibrating && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-panel text-text-primary text-sm px-4 py-2 rounded shadow-lg z-10 pointer-events-none">
              {calibrationPoints.length === 0
                ? 'Click the first calibration point'
                : 'Click the second calibration point'}
            </div>
          )}
          <FloorPlanCanvas
            calibrating={calibrating}
            onCalibrationPoint={handleCalibrationPoint}
            svgRef={svgRef}
          />
        </main>

        {/* Right sidebar: properties */}
        <aside className="w-64 bg-panel border-l border-divider overflow-y-auto shrink-0">
          <PropertiesPanel />
        </aside>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      {/* Modals */}
      {showCalibrationModal && calibrationDistancePx !== null && (
        <ScaleCalibrationModal
          distancePx={calibrationDistancePx}
          onConfirm={handleCalibrationConfirm}
          onCancel={() => { setShowCalibrationModal(false); setCalibrationDistancePx(null) }}
        />
      )}
      {showCustomShapeModal && (
        <CustomShapeModal
          onConfirm={handleCustomShapeConfirm}
          onCancel={() => setShowCustomShapeModal(false)}
        />
      )}
      {showImportModal && (
        <ImportModal
          onConfirm={handleImportConfirm}
          onCancel={() => setShowImportModal(false)}
        />
      )}
    </div>
  )
}
