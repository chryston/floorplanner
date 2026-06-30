import React, { useState, useRef } from 'react'
import { loadProject, ProjectImportError } from '../../utils/projectIO'
import type { FloorProject } from '../../types'

interface Props {
  onConfirm: (project: FloorProject) => void
  onCancel: () => void
}

export function ImportModal({ onConfirm, onCancel }: Props) {
  const [preview, setPreview] = useState<FloorProject | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const project = loadProject(ev.target?.result as string)
        setPreview(project)
        setError(null)
      } catch (err) {
        setPreview(null)
        setError(err instanceof ProjectImportError ? err.message : 'Unknown error')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-panel rounded-lg p-6 w-96 shadow-xl border border-divider">
        <h2 className="text-text-primary font-semibold text-lg mb-4">Import Project</h2>
        <p className="text-text-muted text-sm mb-4">
          Select a <code>.json</code> file exported from Floorplanner. This will replace the current project.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          onChange={handleFile}
          className="w-full text-text-muted text-sm mb-3"
        />
        {error && (
          <p className="text-red-400 text-sm mb-3">{error}</p>
        )}
        {preview && (
          <div className="bg-surface-raised rounded p-3 mb-4 text-sm">
            <p className="text-text-primary font-medium">{preview.name}</p>
            <p className="text-text-muted">{preview.layouts.length} layout(s)</p>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-text-muted hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => preview && onConfirm(preview)}
            disabled={!preview}
            className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Import
          </button>
        </div>
      </div>
    </div>
  )
}
