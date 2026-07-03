import { describe, it, expect, beforeEach, test } from 'vitest'
import { useStore, useTemporalStore, activeLayout, makeDefaultProject } from './store'
import { isFloorObject, WallSegment, DoorObject, DimensionAnnotation, isDimensionAnnotation } from '../types'

function getStore() {
  return useStore.getState()
}

function createTestStore() {
  useStore.setState({ project: makeDefaultProject(), selectedObjectId: null })
  useTemporalStore.getState().clear()
  return useStore
}

beforeEach(() => {
  useStore.setState({ project: makeDefaultProject(), selectedObjectId: null })
  useTemporalStore.getState().clear()
})

describe('activeLayout helper', () => {
  it('returns layout matching activeLayoutId', () => {
    const { project } = getStore()
    const layout = activeLayout(project)
    expect(layout.id).toBe(project.activeLayoutId)
  })
})

describe('layout actions', () => {
  it('addLayout creates a new layout and switches to it', () => {
    const before = getStore().project.layouts.length
    getStore().addLayout('Floor 2')
    const { project } = getStore()
    expect(project.layouts).toHaveLength(before + 1)
    expect(project.activeLayoutId).toBe(project.layouts[project.layouts.length - 1].id)
    expect(project.layouts[project.layouts.length - 1].name).toBe('Floor 2')
  })

  it('duplicateLayout copies objects and layers', () => {
    const { project } = getStore()
    const srcId = project.activeLayoutId
    getStore().addObject('rectangle')
    getStore().duplicateLayout(srcId)
    const { project: p2 } = getStore()
    const duplicate = p2.layouts[p2.layouts.length - 1]
    const source = p2.layouts.find(l => l.id === srcId)!
    expect(duplicate.objects).toHaveLength(source.objects.length)
    expect(duplicate.id).not.toBe(source.id)
  })

  it('deleteLayout removes layout; does not delete last layout', () => {
    getStore().addLayout('Second')
    const { project } = getStore()
    expect(project.layouts).toHaveLength(2)
    const firstId = project.layouts[0].id
    getStore().deleteLayout(firstId)
    expect(getStore().project.layouts).toHaveLength(1)
    // Attempting to delete the last layout is a no-op
    const lastId = getStore().project.layouts[0].id
    getStore().deleteLayout(lastId)
    expect(getStore().project.layouts).toHaveLength(1)
  })

  it('renameLayout updates name', () => {
    const { project } = getStore()
    const id = project.activeLayoutId
    getStore().renameLayout(id, 'Renamed')
    expect(activeLayout(getStore().project).name).toBe('Renamed')
  })
})

describe('object actions', () => {
  it('addObject adds a FloorObject with correct shapeType', () => {
    getStore().addObject('circle')
    const layout = activeLayout(getStore().project)
    expect(layout.objects).toHaveLength(1)
    const obj = layout.objects[0]
    expect(isFloorObject(obj)).toBe(true)
    if (isFloorObject(obj)) {
      expect(obj.shapeType).toBe('circle')
    }
  })

  it('addObject sets width/depth from shape defaults', () => {
    getStore().addObject('wall')
    const obj = activeLayout(getStore().project).objects[0]
    expect(isFloorObject(obj)).toBe(true)
    if (isFloorObject(obj)) {
      expect(obj.width).toBe(300)
      expect(obj.depth).toBe(10)
    }
  })

  it('updateObject merges partial fields', () => {
    getStore().addObject('rectangle')
    const obj = activeLayout(getStore().project).objects[0]
    expect(isFloorObject(obj)).toBe(true)
    if (isFloorObject(obj)) {
      getStore().updateObject(obj.id, { name: 'Sofa', width: 180 })
      const updated = activeLayout(getStore().project).objects[0]
      expect(updated.name).toBe('Sofa')
      expect(isFloorObject(updated)).toBe(true)
      if (isFloorObject(updated)) {
        expect(updated.width).toBe(180)
        expect(updated.depth).toBe(obj.depth) // unchanged
      }
    }
  })

  it('deleteObject removes the object', () => {
    getStore().addObject('square')
    const obj = activeLayout(getStore().project).objects[0]
    getStore().deleteObject(obj.id)
    expect(activeLayout(getStore().project).objects).toHaveLength(0)
  })
})

describe('layer actions', () => {
  it('addLayer creates a layer', () => {
    getStore().addLayer('Furniture')
    const layout = activeLayout(getStore().project)
    const layer = layout.layers.find(l => l.name === 'Furniture')
    expect(layer).toBeDefined()
  })

  it('setLayerVisible toggles visibility', () => {
    getStore().addLayer('Test')
    const layout = activeLayout(getStore().project)
    const layer = layout.layers.find(l => l.name === 'Test')!
    getStore().setLayerVisible(layer.id, false)
    const updated = activeLayout(getStore().project).layers.find(l => l.id === layer.id)!
    expect(updated.visible).toBe(false)
  })

  it('setLayerLocked toggles locked state', () => {
    getStore().addLayer('Walls')
    const layer = activeLayout(getStore().project).layers.find(l => l.name === 'Walls')!
    getStore().setLayerLocked(layer.id, true)
    const updated = activeLayout(getStore().project).layers.find(l => l.id === layer.id)!
    expect(updated.locked).toBe(true)
  })
})

describe('canvas actions', () => {
  it('setPixelsPerMm updates pixelsPerMm', () => {
    getStore().setPixelsPerMm(3.78)
    expect(activeLayout(getStore().project).canvas.pixelsPerMm).toBe(3.78)
  })

  it('clearCanvas resets image and pixelsPerMm to null', () => {
    getStore().setPixelsPerMm(3.78)
    getStore().clearCanvas()
    const canvas = activeLayout(getStore().project).canvas
    expect(canvas.image).toBeNull()
    expect(canvas.pixelsPerMm).toBeNull()
  })
})

describe('selection', () => {
  it('selectObject sets selectedObjectId', () => {
    getStore().selectObject('abc')
    expect(getStore().selectedObjectId).toBe('abc')
  })

  it('clearSelection sets selectedObjectId to null', () => {
    getStore().selectObject('abc')
    getStore().clearSelection()
    expect(getStore().selectedObjectId).toBeNull()
  })
})

describe('importProject', () => {
  it('replaces project and clears selection', () => {
    getStore().selectObject('old')
    const newProject = {
      schemaVersion: 1,
      id: 'new-id',
      name: 'Imported',
      activeLayoutId: 'l1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      layouts: [{
        id: 'l1',
        name: 'Ground Floor',
        objects: [],
        layers: [{ id: 'ly1', name: 'Default', visible: true, locked: false, order: 0 }],
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
      }],
    }
    getStore().importProject(newProject)
    expect(getStore().project.name).toBe('Imported')
    expect(getStore().selectedObjectId).toBeNull()
  })
})

describe('grid and snap settings', () => {
  test('setGridSettings updates active layout canvas', () => {
    const store = createTestStore()
    store.getState().setGridSettings({ enabled: false, minorSpacingMm: 250 })
    const layout = activeLayout(store.getState().project)
    expect(layout.canvas.grid.enabled).toBe(false)
    expect(layout.canvas.grid.minorSpacingMm).toBe(250)
  })

  test('setSnapSettings updates active layout canvas', () => {
    const store = createTestStore()
    store.getState().setSnapSettings({ enabled: false })
    const layout = activeLayout(store.getState().project)
    expect(layout.canvas.snap.enabled).toBe(false)
  })
})

describe('addAnyObject', () => {
  test('adds WallSegment to active layout', () => {
    const store = createTestStore()
    const wall: WallSegment = {
      type: 'wall', id: 'w1', name: 'Wall',
      start: { x: 0, y: 0 }, end: { x: 500, y: 0 },
      thicknessMm: 100,
    }
    store.getState().addAnyObject(wall)
    const layout = activeLayout(store.getState().project)
    expect(layout.objects.find(o => o.id === 'w1')).toBeDefined()
  })

  test('adds DimensionAnnotation to active layout', () => {
    const store = createTestStore()
    const dim: DimensionAnnotation = {
      type: 'dimension', id: 'dim1',
      start: { x: 0, y: 0 }, end: { x: 1000, y: 0 },
    }
    store.getState().addAnyObject(dim)
    const layout = activeLayout(store.getState().project)
    const found = layout.objects.find(o => o.id === 'dim1')
    expect(found).toBeDefined()
    expect(isDimensionAnnotation(found!)).toBe(true)
  })
})

describe('deleteWall', () => {
  test('deletes wall and attached doors/windows', () => {
    const store = createTestStore()
    const wall: WallSegment = {
      type: 'wall', id: 'w1', name: 'W',
      start: { x: 0, y: 0 }, end: { x: 1000, y: 0 },
      thicknessMm: 100,
    }
    const door: DoorObject = {
      type: 'door', id: 'd1', name: 'D', wallId: 'w1',
      offsetMm: 200, widthMm: 900,
      swingDirection: 'left', swingAngleDeg: 90,
    }
    store.getState().addAnyObject(wall)
    store.getState().addAnyObject(door)
    store.getState().deleteWall('w1')
    const layout = activeLayout(store.getState().project)
    expect(layout.objects.find(o => o.id === 'w1')).toBeUndefined()
    expect(layout.objects.find(o => o.id === 'd1')).toBeUndefined()
  })
})
