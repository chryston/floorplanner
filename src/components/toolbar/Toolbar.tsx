import React from 'react'
import { useStore, activeLayout, useTemporalStore } from '../../store/store'
import { downloadProjectJSON } from '../../utils/projectIO'
import { exportSVGBlob, downloadFile } from '../../utils/exportSVG'

interface Props {
  svgRef: React.RefObject<SVGSVGElement | null>
  onUploadImage: () => void
  onCalibrate: () => void
  onImport: () => void
}

export function Toolbar({ svgRef, onUploadImage, onCalibrate, onImport }: Props) {
  const project = useStore(s => s.project)
  const addLayout = useStore(s => s.addLayout)
  const switchLayout = useStore(s => s.switchLayout)
  const deleteLayout = useStore(s => s.deleteLayout)
  const renameLayout = useStore(s => s.renameLayout)
  const duplicateLayout = useStore(s => s.duplicateLayout)

  const { undo, redo, pastStates, futureStates } = useTemporalStore.getState()
  const canUndo = pastStates.length > 0
  const canRedo = futureStates.length > 0

  const layout = activeLayout(project)

  const handleExportSVG = () => {
    const svg = svgRef.current
    if (!svg) return
    const blob = exportSVGBlob(svg)
    downloadFile(blob, `${project.name}.svg`)
  }

  const handleExportJSON = () => {
    downloadProjectJSON(project)
  }

  const handleTabDoubleClick = (layoutId: string, currentName: string) => {
    const newName = window.prompt('Rename layout:', currentName)
    if (newName && newName.trim()) renameLayout(layoutId, newName.trim())
  }

  return (
    <header className="flex items-center gap-2 bg-panel border-b border-divider px-3 py-1.5 overflow-x-auto shrink-0">
      {/* App name */}
      <span className="text-text-primary font-semibold text-sm mr-2 whitespace-nowrap">Floorplanner</span>

      {/* Layout tabs */}
      <div className="flex items-center gap-0.5 flex-1 min-w-0 overflow-x-auto">
        {project.layouts.map(l => (
          <div key={l.id} className="flex items-center gap-0 shrink-0">
            <button
              onClick={() => switchLayout(l.id)}
              onDoubleClick={() => handleTabDoubleClick(l.id, l.name)}
              title="Double-click to rename"
              className={`px-3 py-1 rounded-t text-sm transition-colors ${
                l.id === project.activeLayoutId
                  ? 'bg-surface text-text-primary'
                  : 'text-text-muted hover:text-text-primary hover:bg-surface-raised'
              }`}
            >
              {l.name}
            </button>
            {l.id === project.activeLayoutId && (
              <>
                <button
                  onClick={() => duplicateLayout(l.id)}
                  title="Duplicate layout"
                  className="text-text-muted hover:text-text-primary text-xs px-1"
                >
                  ⧉
                </button>
                <button
                  onClick={() => deleteLayout(l.id)}
                  title="Delete layout"
                  disabled={project.layouts.length <= 1}
                  className="text-text-muted hover:text-red-400 text-xs px-1 disabled:opacity-30"
                >
                  ✕
                </button>
              </>
            )}
          </div>
        ))}
        <button
          onClick={() => addLayout(`Layout ${project.layouts.length + 1}`)}
          title="Add layout"
          className="text-text-muted hover:text-text-primary text-sm px-2"
        >
          +
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => undo()}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className="px-2 py-1 text-text-muted hover:text-text-primary disabled:opacity-30 text-sm"
        >
          ↩
        </button>
        <button
          onClick={() => redo()}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          className="px-2 py-1 text-text-muted hover:text-text-primary disabled:opacity-30 text-sm"
        >
          ↪
        </button>
        <div className="w-px h-4 bg-divider mx-1" />
        <button
          onClick={onUploadImage}
          className="px-2 py-1 text-text-muted hover:text-text-primary text-sm"
          title="Upload floor plan image"
        >
          🖼 Image
        </button>
        {layout.canvas.image && (
          <button
            onClick={onCalibrate}
            className="px-2 py-1 text-text-muted hover:text-text-primary text-sm"
            title="Calibrate scale"
          >
            📏 Scale
          </button>
        )}
        {layout.canvas.pixelsPerMm !== null && (
          <span className="text-text-muted text-xs">
            {layout.canvas.pixelsPerMm.toFixed(2)} px/mm
          </span>
        )}
        <div className="w-px h-4 bg-divider mx-1" />
        <button
          onClick={handleExportSVG}
          className="px-2 py-1 text-text-muted hover:text-text-primary text-sm"
          title="Export as SVG"
        >
          ↓ SVG
        </button>
        <button
          onClick={handleExportJSON}
          className="px-2 py-1 text-text-muted hover:text-text-primary text-sm"
          title="Export as JSON"
        >
          ↓ JSON
        </button>
        <button
          onClick={onImport}
          className="px-2 py-1 text-text-muted hover:text-text-primary text-sm"
          title="Import project"
        >
          ↑ Import
        </button>
      </div>
    </header>
  )
}
