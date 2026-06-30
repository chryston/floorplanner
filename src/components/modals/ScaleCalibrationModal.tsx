import React, { useState } from 'react'

interface Props {
  distancePx: number
  onConfirm: (realMm: number) => void
  onCancel: () => void
}

export function ScaleCalibrationModal({ distancePx, onConfirm, onCancel }: Props) {
  const [value, setValue] = useState('')

  const handleConfirm = () => {
    const mm = parseFloat(value)
    if (isNaN(mm) || mm <= 0) return
    onConfirm(mm)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-panel rounded-lg p-6 w-80 shadow-xl border border-divider">
        <h2 className="text-text-primary font-semibold text-lg mb-4">Set Scale</h2>
        <p className="text-text-muted text-sm mb-4">
          The line you drew is <strong className="text-text-primary">{Math.round(distancePx)}px</strong>.
          Enter the real-world length in millimetres.
        </p>
        <input
          type="number"
          min={1}
          placeholder="e.g. 3000"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleConfirm()}
          className="w-full bg-surface-raised text-text-primary border border-divider rounded px-3 py-2 mb-4 focus:outline-none focus:border-accent"
          autoFocus
        />
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
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
