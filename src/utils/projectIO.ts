import type { FloorProject, GridSettings, SnapSettings } from '../types'
import { SCHEMA_VERSION } from '../store/store'
import { downloadFile } from './exportSVG'

const DEFAULT_GRID: GridSettings = {
  enabled: true,
  minorSpacingMm: 100,
  majorSpacingMm: 1000,
  showMinor: true,
  showMajor: true,
}

const DEFAULT_SNAP: SnapSettings = {
  enabled: true,
  spacingMm: 100,
}

export class ProjectImportError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ProjectImportError'
  }
}

export function exportProject(project: FloorProject): string {
  return JSON.stringify(project, null, 2)
}

export function downloadProjectJSON(project: FloorProject, name?: string): void {
  const filename = `${name ?? project.name ?? 'floorplan'}.json`
  const blob = new Blob([exportProject(project)], { type: 'application/json' })
  downloadFile(blob, filename)
}

// Migrate from an older schema version to current.
export function migrateProject(
  raw: Record<string, unknown>,
  fromVersion: number
): FloorProject {
  // v1 → v2: inject grid/snap into every layout's canvas
  if (fromVersion === 1) {
    const layouts = (raw.layouts as Record<string, unknown>[]) ?? []
    for (const layout of layouts) {
      const canvas = (layout.canvas ?? {}) as Record<string, unknown>
      if (!canvas.grid) canvas.grid = { ...DEFAULT_GRID }
      if (!canvas.snap) canvas.snap = { ...DEFAULT_SNAP }
      layout.canvas = canvas
    }
    raw.schemaVersion = 2
    return raw as unknown as FloorProject
  }
  if (fromVersion === SCHEMA_VERSION) {
    return raw as unknown as FloorProject
  }
  throw new ProjectImportError(`Cannot migrate from schema version ${fromVersion}`)
}

function assertField(obj: Record<string, unknown>, field: string): void {
  if (!(field in obj)) {
    throw new ProjectImportError(`Missing required field: "${field}"`)
  }
}

export function loadProject(raw: unknown): FloorProject {
  let parsed: Record<string, unknown>

  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw)
    } catch {
      throw new ProjectImportError('Invalid JSON: could not parse project file')
    }
  } else if (raw !== null && typeof raw === 'object' && !Array.isArray(raw)) {
    parsed = raw as Record<string, unknown>
  } else {
    throw new ProjectImportError('Invalid input: expected a JSON string or object')
  }

  assertField(parsed, 'schemaVersion')
  assertField(parsed, 'id')
  assertField(parsed, 'name')
  assertField(parsed, 'layouts')
  assertField(parsed, 'activeLayoutId')

  const version = parsed['schemaVersion'] as number
  if (typeof version !== 'number' || version < 1 || version > SCHEMA_VERSION) {
    throw new ProjectImportError(
      `Unsupported schema version: ${version}. Expected 1–${SCHEMA_VERSION}.`
    )
  }

  const layouts = parsed['layouts']
  if (!Array.isArray(layouts) || layouts.length === 0) {
    throw new ProjectImportError('Project must have at least one layout')
  }

  const project = migrateProject(parsed, version)
  return project
}
