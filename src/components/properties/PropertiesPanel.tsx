import { useStore, activeLayout } from '../../store/store'
import type { AnyObject, FloorObject } from '../../types'
import { isFloorObject, isWallSegment, isDoorObject, isWindowObject, isDimensionAnnotation } from '../../types'
import { distance, angleBetween, formatDistance } from '../../utils/geometry'

function NumericField({
  label,
  value,
  onChange,
  min,
  step = 1,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  step?: number
}) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="text-text-muted text-xs">{label}</span>
      <input
        type="number"
        aria-label={label}
        value={value}
        min={min}
        step={step}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className="bg-surface-raised text-text-primary text-sm border border-divider rounded px-2 py-1 focus:outline-none focus:border-accent"
      />
    </label>
  )
}

export function PropertiesPanel() {
  const project = useStore(s => s.project)
  const selectedObjectId = useStore(s => s.selectedObjectId)
  const updateObject = useStore(s => s.updateObject)
  const deleteObject = useStore(s => s.deleteObject)
  const deleteWall = useStore(s => s.deleteWall)
  const clearSelection = useStore(s => s.clearSelection)

  const layout = activeLayout(project)
  const obj: AnyObject | undefined = selectedObjectId
    ? layout.objects.find(o => o.id === selectedObjectId)
    : undefined

  if (!obj) {
    return (
      <div className="p-4 text-text-muted text-sm">
        Select an object to view its properties.
      </div>
    )
  }

  // Wall Segment Panel
  if (isWallSegment(obj)) {
    const len = distance(obj.start, obj.end)
    const angleDeg = (angleBetween(obj.start, obj.end) * 180) / Math.PI

    const handleDelete = () => {
      deleteWall(obj.id)
      clearSelection()
    }

    return (
      <div className="p-3 flex flex-col gap-3 overflow-y-auto">
        <h3 className="text-text-primary font-semibold">Wall</h3>

        {/* Name */}
        <label className="flex flex-col gap-0.5">
          <span className="text-text-muted text-xs">Name</span>
          <input
            type="text"
            value={obj.name}
            onChange={e => updateObject(obj.id, { name: e.target.value })}
            className="bg-surface-raised text-text-primary text-sm border border-divider rounded px-2 py-1 focus:outline-none focus:border-accent"
          />
        </label>

        {/* Length — read-only */}
        <label className="flex flex-col gap-0.5">
          <span className="text-text-muted text-xs">Length</span>
          <span className="text-text-primary text-sm px-2 py-1">{formatDistance(len)}</span>
        </label>

        {/* Angle — read-only */}
        <label className="flex flex-col gap-0.5">
          <span className="text-text-muted text-xs">Angle</span>
          <span className="text-text-primary text-sm px-2 py-1">{angleDeg.toFixed(1)}°</span>
        </label>

        {/* Thickness */}
        <NumericField
          label="Thickness (mm)"
          value={obj.thicknessMm}
          min={1}
          onChange={v => updateObject(obj.id, { thicknessMm: v })}
        />

        {/* Start coordinates */}
        <div className="flex gap-2">
          <NumericField
            label="Start X"
            value={obj.start.x}
            onChange={v => updateObject(obj.id, { start: { ...obj.start, x: v } })}
          />
          <NumericField
            label="Start Y"
            value={obj.start.y}
            onChange={v => updateObject(obj.id, { start: { ...obj.start, y: v } })}
          />
        </div>

        {/* End coordinates */}
        <div className="flex gap-2">
          <NumericField
            label="End X"
            value={obj.end.x}
            onChange={v => updateObject(obj.id, { end: { ...obj.end, x: v } })}
          />
          <NumericField
            label="End Y"
            value={obj.end.y}
            onChange={v => updateObject(obj.id, { end: { ...obj.end, y: v } })}
          />
        </div>

        {/* Memo */}
        <label className="flex flex-col gap-0.5">
          <span className="text-text-muted text-xs">Memo</span>
          <textarea
            value={obj.memo ?? ''}
            onChange={e => updateObject(obj.id, { memo: e.target.value })}
            rows={3}
            placeholder="Notes about this wall…"
            className="bg-surface-raised text-text-primary text-sm border border-divider rounded px-2 py-1 resize-none focus:outline-none focus:border-accent"
          />
        </label>

        {/* Delete */}
        <button
          onClick={handleDelete}
          className="mt-2 px-3 py-2 bg-red-800 hover:bg-red-700 text-white rounded text-sm transition-colors"
        >
          Delete Wall + Attachments
        </button>
      </div>
    )
  }

  // Dimension Annotation Panel
  if (isDimensionAnnotation(obj)) {
    const len = distance(obj.start, obj.end)

    const handleDelete = () => {
      deleteObject(obj.id)
      clearSelection()
    }

    return (
      <div className="p-3 flex flex-col gap-3 overflow-y-auto">
        <h3 className="text-text-primary font-semibold">Dimension</h3>

        {/* Length — read-only */}
        <label className="flex flex-col gap-0.5">
          <span className="text-text-muted text-xs">Length</span>
          <span className="text-text-primary text-sm px-2 py-1">{formatDistance(len)}</span>
        </label>

        {/* Name */}
        <label className="flex flex-col gap-0.5">
          <span className="text-text-muted text-xs">Name</span>
          <input
            type="text"
            value={obj.name ?? ''}
            onChange={e => updateObject(obj.id, { name: e.target.value })}
            className="bg-surface-raised text-text-primary text-sm border border-divider rounded px-2 py-1 focus:outline-none focus:border-accent"
          />
        </label>

        {/* Delete */}
        <button
          onClick={handleDelete}
          className="mt-2 px-3 py-2 bg-red-800 hover:bg-red-700 text-white rounded text-sm transition-colors"
        >
          Delete
        </button>
      </div>
    )
  }

  // Door Object Panel
  if (isDoorObject(obj)) {
    const handleDelete = () => {
      deleteObject(obj.id)
      clearSelection()
    }

    return (
      <div className="p-3 flex flex-col gap-3 overflow-y-auto">
        <h3 className="text-text-primary font-semibold">Door</h3>

        {/* Name */}
        <label className="flex flex-col gap-0.5">
          <span className="text-text-muted text-xs">Name</span>
          <input
            type="text"
            value={obj.name}
            onChange={e => updateObject(obj.id, { name: e.target.value })}
            className="bg-surface-raised text-text-primary text-sm border border-divider rounded px-2 py-1 focus:outline-none focus:border-accent"
          />
        </label>

        {/* Width */}
        <NumericField
          label="Width (mm)"
          value={obj.widthMm}
          min={1}
          onChange={v => updateObject(obj.id, { widthMm: v })}
        />

        {/* Swing Direction */}
        <label className="flex flex-col gap-0.5">
          <span className="text-text-muted text-xs">Swing Direction</span>
          <select
            value={obj.swingDirection}
            onChange={e => updateObject(obj.id, { swingDirection: e.target.value as 'left' | 'right' })}
            className="bg-surface-raised text-text-primary text-sm border border-divider rounded px-2 py-1 focus:outline-none focus:border-accent"
          >
            <option value="left">Left</option>
            <option value="right">Right</option>
          </select>
        </label>

        {/* Swing Angle */}
        <NumericField
          label="Swing Angle (°)"
          value={obj.swingAngleDeg}
          min={0}
          onChange={v => updateObject(obj.id, { swingAngleDeg: Math.min(180, Math.max(0, v)) })}
        />

        {/* Delete */}
        <button
          onClick={handleDelete}
          className="mt-2 px-3 py-2 bg-red-800 hover:bg-red-700 text-white rounded text-sm transition-colors"
        >
          Delete
        </button>
      </div>
    )
  }

  // Window Object Panel
  if (isWindowObject(obj)) {
    const handleDelete = () => {
      deleteObject(obj.id)
      clearSelection()
    }

    return (
      <div className="p-3 flex flex-col gap-3 overflow-y-auto">
        <h3 className="text-text-primary font-semibold">Window</h3>

        {/* Name */}
        <label className="flex flex-col gap-0.5">
          <span className="text-text-muted text-xs">Name</span>
          <input
            type="text"
            value={obj.name}
            onChange={e => updateObject(obj.id, { name: e.target.value })}
            className="bg-surface-raised text-text-primary text-sm border border-divider rounded px-2 py-1 focus:outline-none focus:border-accent"
          />
        </label>

        {/* Width */}
        <NumericField
          label="Width (mm)"
          value={obj.widthMm}
          min={1}
          onChange={v => updateObject(obj.id, { widthMm: v })}
        />

        {/* Delete */}
        <button
          onClick={handleDelete}
          className="mt-2 px-3 py-2 bg-red-800 hover:bg-red-700 text-white rounded text-sm transition-colors"
        >
          Delete
        </button>
      </div>
    )
  }

  // FloorObject Panel
  if (isFloorObject(obj)) {
    const update = (patch: Partial<FloorObject>) => updateObject(obj.id, patch)

    const handleDelete = () => {
      deleteObject(obj.id)
      clearSelection()
    }

    return (
      <div className="p-3 flex flex-col gap-3 overflow-y-auto">
        {/* Name */}
        <label className="flex flex-col gap-0.5">
          <span className="text-text-muted text-xs">Name</span>
          <input
            type="text"
            value={obj.name}
            onChange={e => update({ name: e.target.value })}
            className="bg-surface-raised text-text-primary text-sm border border-divider rounded px-2 py-1 focus:outline-none focus:border-accent"
          />
        </label>

        {/* Shape type — read-only */}
        <label className="flex flex-col gap-0.5">
          <span className="text-text-muted text-xs">Shape</span>
          <span className="text-text-primary text-sm px-2 py-1">{obj.shapeType}</span>
        </label>

        {/* Dimensions */}
        <div className="flex gap-2">
          <NumericField label="Width (mm)" value={obj.width} min={1} onChange={v => update({ width: v })} />
          <NumericField label="Depth (mm)" value={obj.depth} min={1} onChange={v => update({ depth: v })} />
        </div>
        <NumericField label="Height (mm)" value={obj.height} min={1} onChange={v => update({ height: v })} />

        {/* Rotation */}
        <div className="flex flex-col gap-0.5">
          <span className="text-text-muted text-xs">Rotation (°)</span>
          <div className="flex gap-1">
            <input
              type="number"
              min={0}
              max={360}
              value={obj.rotation}
              onChange={e => update({ rotation: parseFloat(e.target.value) || 0 })}
              className="flex-1 bg-surface-raised text-text-primary text-sm border border-divider rounded px-2 py-1 focus:outline-none focus:border-accent"
            />
            <button
              onClick={() => update({ rotation: 0 })}
              title="Reset rotation"
              className="px-2 py-1 bg-surface-raised hover:bg-divider text-text-muted rounded text-xs"
            >
              Reset
            </button>
            <button
              onClick={() => update({ rotation: ((obj.rotation + 90) % 360) })}
              title="Rotate 90°"
              className="px-2 py-1 bg-surface-raised hover:bg-divider text-text-muted rounded text-xs"
            >
              +90°
            </button>
          </div>
        </div>

        {/* Layer */}
        <label className="flex flex-col gap-0.5">
          <span className="text-text-muted text-xs">Layer</span>
          <select
            value={obj.layerId}
            onChange={e => update({ layerId: e.target.value })}
            className="bg-surface-raised text-text-primary text-sm border border-divider rounded px-2 py-1 focus:outline-none focus:border-accent"
          >
            {layout.layers.map(layer => (
              <option key={layer.id} value={layer.id}>{layer.name}</option>
            ))}
          </select>
        </label>

        {/* Fill + Stroke */}
        <div className="flex gap-2">
          <label className="flex flex-col gap-0.5 flex-1">
            <span className="text-text-muted text-xs">Fill</span>
            <input
              type="color"
              value={obj.fill ?? '#60a5fa'}
              onChange={e => update({ fill: e.target.value })}
              className="w-full h-8 rounded cursor-pointer bg-surface-raised border border-divider"
            />
          </label>
          <label className="flex flex-col gap-0.5 flex-1">
            <span className="text-text-muted text-xs">Stroke</span>
            <input
              type="color"
              value={obj.stroke ?? '#2563eb'}
              onChange={e => update({ stroke: e.target.value })}
              className="w-full h-8 rounded cursor-pointer bg-surface-raised border border-divider"
            />
          </label>
        </div>

        {/* Locked */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={obj.locked ?? false}
            onChange={e => update({ locked: e.target.checked })}
            className="accent-accent"
          />
          <span className="text-text-primary text-sm">Locked</span>
        </label>

        {/* Memo */}
        <label className="flex flex-col gap-0.5">
          <span className="text-text-muted text-xs" id="memo-label">Memo</span>
          <textarea
            aria-label="Memo"
            value={obj.memo ?? ''}
            onChange={e => update({ memo: e.target.value })}
            rows={3}
            placeholder="Notes about this object…"
            className="bg-surface-raised text-text-primary text-sm border border-divider rounded px-2 py-1 resize-none focus:outline-none focus:border-accent"
          />
        </label>

        {/* Delete */}
        <button
          onClick={handleDelete}
          className="mt-2 px-3 py-2 bg-red-800 hover:bg-red-700 text-white rounded text-sm transition-colors"
        >
          Delete Object
        </button>
      </div>
    )
  }

  // Should not reach here
  return (
    <div className="p-4 text-text-muted text-sm">
      Unknown object type.
    </div>
  )
}
