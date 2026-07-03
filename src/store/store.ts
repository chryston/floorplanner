import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { temporal } from 'zundo'
import { produce } from 'immer'
import { nanoid } from 'nanoid'
import { shallow } from 'zustand/shallow'
import type { FloorProject, FloorLayout, FloorLayer, FloorObject, ShapeType, GridSettings, SnapSettings, AnyObject, DoorObject, WindowObject } from '../types'
import { isFloorObject } from '../types'
import { getShapeDefaults } from '../data/shapes'

export const SCHEMA_VERSION = 2

function makeDefaultLayer(): FloorLayer {
  return { id: nanoid(), name: 'Default', visible: true, locked: false, order: 0 }
}

function makeDefaultLayout(name: string): FloorLayout {
  return {
    id: nanoid(),
    name,
    objects: [],
    layers: [makeDefaultLayer()],
    canvas: {
      image: null,
      pixelsPerMm: null,
      grid: {
        enabled: true,
        minorSpacingMm: 100,
        majorSpacingMm: 1000,
        showMinor: true,
        showMajor: true,
      },
      snap: {
        enabled: true,
        spacingMm: 100,
      },
    },
  }
}

export function makeDefaultProject(): FloorProject {
  const layout = makeDefaultLayout('Ground Floor')
  return {
    schemaVersion: SCHEMA_VERSION,
    id: nanoid(),
    name: 'My Floor Plan',
    layouts: [layout],
    activeLayoutId: layout.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export function activeLayout(project: FloorProject): FloorLayout {
  return project.layouts.find(l => l.id === project.activeLayoutId) ?? project.layouts[0]
}

interface StoreState {
  project: FloorProject
  selectedObjectId: string | null
  // Layout actions
  setProjectName: (name: string) => void
  addLayout: (name: string) => void
  duplicateLayout: (layoutId: string) => void
  renameLayout: (layoutId: string, name: string) => void
  deleteLayout: (layoutId: string) => void
  switchLayout: (layoutId: string) => void
  setLayoutMemo: (layoutId: string, memo: string) => void
  // Object actions
  addObject: (shapeType: ShapeType) => void
  addCustomObject: (name: string, shapeType: ShapeType, width: number, depth: number) => void
  updateObject: (objectId: string, patch: Partial<AnyObject>) => void
  deleteObject: (objectId: string) => void
  // Layer actions
  addLayer: (name: string) => void
  renameLayer: (layerId: string, name: string) => void
  setLayerVisible: (layerId: string, visible: boolean) => void
  setLayerLocked: (layerId: string, locked: boolean) => void
  reorderLayer: (layerId: string, newOrder: number) => void
  deleteLayer: (layerId: string) => void
  // Canvas actions
  setCanvasImage: (image: FloorProject['layouts'][0]['canvas']['image']) => void
  setPixelsPerMm: (ppm: number) => void
  clearCanvas: () => void
  setGridSettings: (patch: Partial<GridSettings>) => void
  setSnapSettings: (patch: Partial<SnapSettings>) => void
  addAnyObject: (obj: AnyObject) => void
  deleteWall: (wallId: string) => void
  // Project IO
  importProject: (project: FloorProject) => void
  // Selection (not persisted)
  selectObject: (id: string) => void
  clearSelection: () => void
}

const stateCreator = (set: (fn: (s: StoreState) => void) => void): StoreState => ({
  project: makeDefaultProject(),
  selectedObjectId: null,

  setProjectName: (name) => set(s => { s.project.name = name; s.project.updatedAt = new Date().toISOString() }),

  addLayout: (name) => set(s => {
    const layout = makeDefaultLayout(name)
    s.project.layouts.push(layout)
    s.project.activeLayoutId = layout.id
    s.project.updatedAt = new Date().toISOString()
  }),

  duplicateLayout: (layoutId) => set(s => {
    const src = s.project.layouts.find(l => l.id === layoutId)
    if (!src) return
    const dup: FloorLayout = {
      ...JSON.parse(JSON.stringify(src)),
      id: nanoid(),
      name: src.name + ' (copy)',
    }
    s.project.layouts.push(dup)
    s.project.activeLayoutId = dup.id
    s.project.updatedAt = new Date().toISOString()
  }),

  renameLayout: (layoutId, name) => set(s => {
    const layout = s.project.layouts.find(l => l.id === layoutId)
    if (layout) layout.name = name
    s.project.updatedAt = new Date().toISOString()
  }),

  deleteLayout: (layoutId) => set(s => {
    if (s.project.layouts.length <= 1) return
    const idx = s.project.layouts.findIndex(l => l.id === layoutId)
    if (idx === -1) return
    s.project.layouts.splice(idx, 1)
    if (s.project.activeLayoutId === layoutId) {
      s.project.activeLayoutId = s.project.layouts[Math.max(0, idx - 1)].id
    }
    s.project.updatedAt = new Date().toISOString()
  }),

  switchLayout: (layoutId) => set(s => {
    if (s.project.layouts.some(l => l.id === layoutId)) {
      s.project.activeLayoutId = layoutId
    }
    s.project.updatedAt = new Date().toISOString()
  }),

  setLayoutMemo: (layoutId, memo) => set(s => {
    const layout = s.project.layouts.find(l => l.id === layoutId)
    if (layout) layout.memo = memo
    s.project.updatedAt = new Date().toISOString()
  }),

  addObject: (shapeType) => set(s => {
    const layout = s.project.layouts.find(l => l.id === s.project.activeLayoutId) ?? s.project.layouts[0]
    const { width, depth } = getShapeDefaults(shapeType)
    const canvas = layout.canvas
    let x = 100
    let y = 100
    if (canvas.image && canvas.pixelsPerMm) {
      const imgW = canvas.image.widthPx / canvas.pixelsPerMm
      const imgH = canvas.image.heightPx / canvas.pixelsPerMm
      x = Math.max(0, imgW / 2 - width / 2)
      y = Math.max(0, imgH / 2 - depth / 2)
    }
    const defaultLayerId = layout.layers[0]?.id ?? ''
    const obj: FloorObject = {
      id: nanoid(),
      name: shapeType,
      shapeType,
      layerId: defaultLayerId,
      x,
      y,
      width,
      depth,
      height: 2400,
      rotation: 0,
      fill: '#60a5fa',
      stroke: '#2563eb',
      locked: false,
      visible: true,
    }
    layout.objects.push(obj)
    s.project.updatedAt = new Date().toISOString()
  }),

  addCustomObject: (name, shapeType, width, depth) => set(s => {
    const layout = s.project.layouts.find(l => l.id === s.project.activeLayoutId) ?? s.project.layouts[0]
    const canvas = layout.canvas
    let x = 100, y = 100
    if (canvas.image && canvas.pixelsPerMm) {
      const imgW = canvas.image.widthPx / canvas.pixelsPerMm
      const imgH = canvas.image.heightPx / canvas.pixelsPerMm
      x = Math.max(0, imgW / 2 - width / 2)
      y = Math.max(0, imgH / 2 - depth / 2)
    }
    const defaultLayerId = layout.layers[0]?.id ?? ''
    const obj: FloorObject = {
      id: nanoid(),
      name,
      shapeType,
      layerId: defaultLayerId,
      x, y, width, depth,
      height: 2400,
      rotation: 0,
      fill: '#60a5fa',
      stroke: '#2563eb',
      locked: false,
      visible: true,
    }
    layout.objects.push(obj)
    s.project.updatedAt = new Date().toISOString()
  }),

  updateObject: (objectId, patch) => set(s => {
    const layout = s.project.layouts.find(l => l.id === s.project.activeLayoutId) ?? s.project.layouts[0]
    const obj = layout.objects.find(o => o.id === objectId)
    if (obj) {
      Object.assign(obj, patch)
      if (isFloorObject(obj) && 'rotation' in patch && patch.rotation !== undefined) {
        obj.rotation = ((patch.rotation % 360) + 360) % 360
      }
    }
    s.project.updatedAt = new Date().toISOString()
  }),

  deleteObject: (objectId) => set(s => {
    const layout = s.project.layouts.find(l => l.id === s.project.activeLayoutId) ?? s.project.layouts[0]
    const idx = layout.objects.findIndex(o => o.id === objectId)
    if (idx !== -1) layout.objects.splice(idx, 1)
    if (s.selectedObjectId === objectId) s.selectedObjectId = null
    s.project.updatedAt = new Date().toISOString()
  }),

  addLayer: (name) => set(s => {
    const layout = s.project.layouts.find(l => l.id === s.project.activeLayoutId) ?? s.project.layouts[0]
    const maxOrder = layout.layers.reduce((m, l) => Math.max(m, l.order), -1)
    layout.layers.push({ id: nanoid(), name, visible: true, locked: false, order: maxOrder + 1 })
    s.project.updatedAt = new Date().toISOString()
  }),

  renameLayer: (layerId, name) => set(s => {
    const layout = s.project.layouts.find(l => l.id === s.project.activeLayoutId) ?? s.project.layouts[0]
    const layer = layout.layers.find(l => l.id === layerId)
    if (layer) layer.name = name
    s.project.updatedAt = new Date().toISOString()
  }),

  setLayerVisible: (layerId, visible) => set(s => {
    const layout = s.project.layouts.find(l => l.id === s.project.activeLayoutId) ?? s.project.layouts[0]
    const layer = layout.layers.find(l => l.id === layerId)
    if (layer) layer.visible = visible
    s.project.updatedAt = new Date().toISOString()
  }),

  setLayerLocked: (layerId, locked) => set(s => {
    const layout = s.project.layouts.find(l => l.id === s.project.activeLayoutId) ?? s.project.layouts[0]
    const layer = layout.layers.find(l => l.id === layerId)
    if (layer) layer.locked = locked
    s.project.updatedAt = new Date().toISOString()
  }),

  reorderLayer: (layerId, newOrder) => set(s => {
    const layout = s.project.layouts.find(l => l.id === s.project.activeLayoutId) ?? s.project.layouts[0]
    const layer = layout.layers.find(l => l.id === layerId)
    if (layer) layer.order = newOrder
    s.project.updatedAt = new Date().toISOString()
  }),

  deleteLayer: (layerId) => set(s => {
    const layout = s.project.layouts.find(l => l.id === s.project.activeLayoutId) ?? s.project.layouts[0]
    if (layout.layers.length <= 1) return
    const idx = layout.layers.findIndex(l => l.id === layerId)
    if (idx !== -1) {
      layout.layers.splice(idx, 1)
      const fallbackLayerId = layout.layers[0].id
      for (const obj of layout.objects) {
        if (obj.layerId === layerId) obj.layerId = fallbackLayerId
      }
    }
    s.project.updatedAt = new Date().toISOString()
  }),

  setCanvasImage: (image) => set(s => {
    const layout = s.project.layouts.find(l => l.id === s.project.activeLayoutId) ?? s.project.layouts[0]
    layout.canvas.image = image
    s.project.updatedAt = new Date().toISOString()
  }),

  setPixelsPerMm: (ppm) => set(s => {
    const layout = s.project.layouts.find(l => l.id === s.project.activeLayoutId) ?? s.project.layouts[0]
    layout.canvas.pixelsPerMm = ppm
    s.project.updatedAt = new Date().toISOString()
  }),

  clearCanvas: () => set(s => {
    const layout = s.project.layouts.find(l => l.id === s.project.activeLayoutId) ?? s.project.layouts[0]
    layout.canvas.image = null
    layout.canvas.pixelsPerMm = null
    s.project.updatedAt = new Date().toISOString()
  }),

  setGridSettings: (patch) => set(s => {
    const layout = activeLayout(s.project)
    Object.assign(layout.canvas.grid, patch)
    s.project.updatedAt = new Date().toISOString()
  }),

  setSnapSettings: (patch) => set(s => {
    const layout = activeLayout(s.project)
    Object.assign(layout.canvas.snap, patch)
    s.project.updatedAt = new Date().toISOString()
  }),

  addAnyObject: (obj) => set(s => {
    const layout = activeLayout(s.project)
    layout.objects.push(obj)
    s.project.updatedAt = new Date().toISOString()
  }),

  deleteWall: (wallId) => set(s => {
    const layout = activeLayout(s.project)
    layout.objects = layout.objects.filter(
      o => o.id !== wallId &&
        !('wallId' in o && (o as DoorObject | WindowObject).wallId === wallId)
    )
    s.project.updatedAt = new Date().toISOString()
  }),

  importProject: (project) => set(s => {
    s.project = project
    s.selectedObjectId = null
  }),

  selectObject: (id) => set(s => { s.selectedObjectId = id }),
  clearSelection: () => set(s => { s.selectedObjectId = null }),
})

const immerCreator = (set: any) => stateCreator((fn) => set(produce(fn)))

export const useStore = create<StoreState>()(
  persist(
    temporal(
      immerCreator,
      {
        partialize: (s: StoreState) => ({ project: s.project }),
        equality: shallow,
      }
    ),
    {
      name: 'floorplanner-v1',
      partialize: (s) => ({ project: s.project }),
    }
  )
)

export const useTemporalStore = (useStore as any).temporal
