import React, { useState } from 'react'

interface Props {
  onConfirm: (name: string, width: number, depth: number) => void
  onCancel: () => void
}

export function CustomShapeModal({ onConfirm, onCancel }: Props) {
  const [name, setName] = useState('')
  const [width, setWidth] = useState('200')
  const [depth, setDepth] = useState('100')

  const handleConfirm = () => {
    const w = parseFloat(width)
    const d = parseFloat(depth)
    if (!name.trim() || isNaN(w) || w <= 0 || isNaN(d) || d <= 0) return
    onConfirm(name.trim(), w, d)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-panel rounded-lg p-6 w-80 shadow-xl border border-divider">
        <h2 className="text-text-primary font-semibold text-lg mb-4">Custom Shape</h2>
        <div className="flex flex-col gap-3 mb-4">
          <div>
            <label className="text-text-muted text-sm block mb-1">Name</label>
            <input
              type="text"
              placeholder="e.g. Desk"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-surface-raised text-text-primary border border-divider rounded px-3 py-2 focus:outline-none focus:border-accent"
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-text-muted text-sm block mb-1">Width (mm)</label>
              <input
                type="number"
                min={1}
                value={width}
                onChange={e => setWidth(e.target.value)}
                className="w-full bg-surface-raised text-text-primary border border-divider rounded px-3 py-2 focus:outline-none focus:border-accent"
              />
            </div>
            <div className="flex-1">
              <label className="text-text-muted text-sm block mb-1">Depth (mm)</label>
              <input
                type="number"
                min={1}
                value={depth}
                onChange={e => setDepth(e.target.value)}
                className="w-full bg-surface-raised text-text-primary border border-divider rounded px-3 py-2 focus:outline-none focus:border-accent"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-text-muted hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded transition-colors"
          >
            Add Shape
          </button>
        </div>
      </div>
    </div>
  )
}
