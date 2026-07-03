import { describe, it, expect } from 'vitest'
import { exportProject, loadProject, ProjectImportError } from './projectIO'
import { makeDefaultProject } from '../store/store'
import type { FloorProject, WallSegment } from '../types'
import { isWallSegment } from '../types'

function makeProject(overrides: Partial<FloorProject> = {}): FloorProject {
  return {
    schemaVersion: 1,
    id: 'p1',
    name: 'Test Project',
    activeLayoutId: 'l1',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    layouts: [
      {
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
      },
    ],
    ...overrides,
  }
}

describe('exportProject', () => {
  it('serializes project to valid JSON', () => {
    const project = makeProject()
    const json = exportProject(project)
    expect(() => JSON.parse(json)).not.toThrow()
  })

  it('round-trips: parse exported JSON gives same project', () => {
    const project = makeProject()
    const loaded = loadProject(exportProject(project))
    expect(loaded.id).toBe(project.id)
    expect(loaded.name).toBe(project.name)
    expect(loaded.layouts).toHaveLength(1)
    expect(loaded.layouts[0].layers).toHaveLength(1)
  })
})

describe('loadProject', () => {
  it('throws ProjectImportError for non-string, non-object input', () => {
    expect(() => loadProject(null)).toThrow(ProjectImportError)
    expect(() => loadProject(42)).toThrow(ProjectImportError)
    expect(() => loadProject(undefined)).toThrow(ProjectImportError)
  })

  it('throws ProjectImportError for invalid JSON string', () => {
    expect(() => loadProject('{bad json')).toThrow(ProjectImportError)
  })

  it('throws ProjectImportError when required fields missing', () => {
    expect(() => loadProject(JSON.stringify({ name: 'No layouts' }))).toThrow(ProjectImportError)
  })

  it('throws ProjectImportError when layouts is empty array', () => {
    const bad = makeProject({ layouts: [] })
    expect(() => loadProject(JSON.stringify(bad))).toThrow(ProjectImportError)
  })

  it('throws ProjectImportError for unknown schema version', () => {
    const future = makeProject({ schemaVersion: 999 })
    expect(() => loadProject(JSON.stringify(future))).toThrow(ProjectImportError)
  })

  it('accepts valid project string', () => {
    const project = makeProject()
    expect(() => loadProject(JSON.stringify(project))).not.toThrow()
  })

  it('accepts valid project object', () => {
    const project = makeProject()
    expect(() => loadProject(project)).not.toThrow()
  })

  it('preserves objects in loaded project', () => {
    const project = makeProject()
    project.layouts[0].objects.push({
      id: 'o1', name: 'Sofa', shapeType: 'rectangle',
      layerId: 'ly1', x: 10, y: 20, width: 100, depth: 50,
      height: 800, rotation: 0, fill: '#blue', stroke: '#black',
      locked: false, visible: true,
    })
    const loaded = loadProject(exportProject(project))
    expect(loaded.layouts[0].objects).toHaveLength(1)
    expect(loaded.layouts[0].objects[0].memo).toBeUndefined()
  })
})

describe('schema migration v1 → v2', () => {
  it('injects grid and snap defaults when missing', () => {
    const v1Project = {
      schemaVersion: 1,
      id: 'test',
      name: 'Test',
      layouts: [
        {
          id: 'l1',
          name: 'Ground Floor',
          objects: [],
          layers: [{ id: 'ly1', name: 'Default', visible: true, locked: false, order: 0 }],
          canvas: { image: null, pixelsPerMm: null },
        },
      ],
      activeLayoutId: 'l1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }
    const result = loadProject(JSON.stringify(v1Project))
    expect(result.schemaVersion).toBe(2)
    expect(result.layouts[0].canvas.grid).toBeDefined()
    expect(result.layouts[0].canvas.grid.enabled).toBe(true)
    expect(result.layouts[0].canvas.snap).toBeDefined()
    expect(result.layouts[0].canvas.snap.enabled).toBe(true)
  })

  it('round-trip preserves WallSegment', () => {
    const wall: WallSegment = {
      type: 'wall', id: 'w1', name: 'Wall 1',
      start: { x: 0, y: 0 }, end: { x: 1000, y: 0 },
      thicknessMm: 100,
    }
    const proj = makeDefaultProject()
    proj.layouts[0].objects.push(wall)
    const json = exportProject(proj)
    const loaded = loadProject(json)
    const loaded_wall = loaded.layouts[0].objects.find(o => o.id === 'w1')
    expect(loaded_wall).toBeDefined()
    expect(isWallSegment(loaded_wall!)).toBe(true)
  })
})
