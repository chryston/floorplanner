import { useState } from 'react'
import { useStore, activeLayout } from '../../store/store'

export function LayersPanel() {
  const project = useStore(s => s.project)
  const addLayer = useStore(s => s.addLayer)
  const renameLayer = useStore(s => s.renameLayer)
  const setLayerVisible = useStore(s => s.setLayerVisible)
  const setLayerLocked = useStore(s => s.setLayerLocked)
  const deleteLayer = useStore(s => s.deleteLayer)

  const layout = activeLayout(project)
  const sorted = [...layout.layers].sort((a, b) => b.order - a.order)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  return (
    <div className="p-2">
      <div className="flex items-center justify-between mb-2 px-1">
        <p className="text-text-muted text-xs font-semibold uppercase tracking-wider">Layers</p>
        <button
          onClick={() => addLayer(`Layer ${layout.layers.length + 1}`)}
          className="text-accent hover:text-accent-hover text-xs"
          title="Add layer"
        >
          + Add
        </button>
      </div>
      <div className="flex flex-col gap-0.5">
        {sorted.map(layer => (
          <div
            key={layer.id}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-surface-raised group"
          >
            {/* Visibility */}
            <button
              onClick={() => setLayerVisible(layer.id, !layer.visible)}
              title={layer.visible ? 'Hide layer' : 'Show layer'}
              className="text-text-muted hover:text-text-primary w-4"
            >
              {layer.visible ? '👁' : '🙈'}
            </button>

            {/* Lock */}
            <button
              onClick={() => setLayerLocked(layer.id, !layer.locked)}
              title={layer.locked ? 'Unlock layer' : 'Lock layer'}
              className="text-text-muted hover:text-text-primary w-4"
            >
              {layer.locked ? '🔒' : '🔓'}
            </button>

            {/* Name */}
            {editingId === layer.id ? (
              <input
                autoFocus
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onBlur={() => {
                  if (editName.trim()) renameLayer(layer.id, editName.trim())
                  setEditingId(null)
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    if (editName.trim()) renameLayer(layer.id, editName.trim())
                    setEditingId(null)
                  }
                  if (e.key === 'Escape') setEditingId(null)
                }}
                className="flex-1 bg-surface-raised text-text-primary text-xs rounded px-1 py-0.5 focus:outline-none"
              />
            ) : (
              <span
                className="flex-1 text-xs text-text-primary truncate cursor-pointer"
                onDoubleClick={() => { setEditingId(layer.id); setEditName(layer.name) }}
              >
                {layer.name}
              </span>
            )}

            {/* Delete — hidden unless hovering, disabled on last layer */}
            <button
              onClick={() => deleteLayer(layer.id)}
              disabled={layout.layers.length <= 1}
              title="Delete layer"
              className="text-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-20 text-xs"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
