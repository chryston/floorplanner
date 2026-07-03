# Floorplanner Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add grid overlay, snap-to-grid, dimension labels, dimension-line annotations, improved wall drawing, and door/window objects to the existing React+SVG floor planner.

**Architecture:** New object types (WallSegment, DoorObject, WindowObject, DimensionAnnotation) join `FloorLayout.objects` alongside existing `FloorObject`. Drawing tools live in App.tsx as local state machines; FloorPlanCanvas exposes world-coordinate callbacks. All new types persist via JSON and Zustand.

**Tech Stack:** React, TypeScript, Vite, Zustand + Immer + Zundo, custom SVG rendering, Vitest

## Global Constraints

- No new large dependencies (no Fabric.js, Konva, Three.js)
- No `any` types (except where pre-existing `any` in immerCreator must remain)
- All changes testable in isolation
- `npm test` and `npm run build` must stay green after every task
- Existing feature regression is a blocker
- Compact response format: what changed / files / how to test / known limitations

---

## File Map

**Create:**
- `src/utils/geometry.ts` — pure geometry helpers
- `src/utils/geometry.test.ts`
- `src/components/canvas/GridOverlay.tsx` — SVG grid pattern renderer
- `src/components/canvas/DimensionLabel.tsx` — selected-object inline dimension overlay
- `src/components/canvas/DimensionLine.tsx` — dimension annotation object renderer
- `src/components/canvas/WallSegmentRenderer.tsx` — wall object renderer + handles
- `src/components/canvas/DoorWindowRenderer.tsx` — door/window object renderers

**Modify:**
- `src/types/index.ts` — add GridSettings, SnapSettings, WallSegment, DoorObject, WindowObject, DimensionAnnotation, AnyObject, ActiveTool
- `src/utils/projectIO.ts` — schema v1→v2 migration
- `src/store/store.ts` — new state fields + actions; bump SCHEMA_VERSION to 2
- `src/components/canvas/FloorPlanCanvas.tsx` — add GridOverlay, activeTool prop, world-coordinate callbacks, drawingPreview slot
- `src/components/canvas/PlacedObject.tsx` — apply snapPoint to drag and resize
- `src/components/properties/PropertiesPanel.tsx` — panels for wall/dimension/door/window
- `src/components/toolbar/Toolbar.tsx` — tool buttons, grid/snap controls
- `src/App.tsx` — active tool state, drawing state machines, keyboard shortcuts
- `src/utils/exportSVG.ts` — render new object types into SVG export
- `src/store/store.test.ts` — new store action tests
- `src/utils/projectIO.test.ts` — migration and round-trip tests

---

## Task 1: Geometry Utilities

**Files:**
- Create: `src/utils/geometry.ts`
- Create: `src/utils/geometry.test.ts`

**Interfaces:**
- Produces: `distance`, `angleBetween`, `projectPointToSegment`, `clamp`, `pointAlongSegment`, `snapValue`, `snapPoint`, `formatDistance`, `constrainAngle` — used by Tasks 3–10

---

- [ ] **Step 1: Write the failing tests**

```ts
// src/utils/geometry.test.ts
import { describe, test, expect } from 'vitest'
import {
  distance, angleBetween, projectPointToSegment, clamp,
  pointAlongSegment, snapValue, snapPoint, formatDistance, constrainAngle,
} from './geometry'

describe('geometry', () => {
  test('distance', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBeCloseTo(5)
  })

  test('angleBetween', () => {
    expect(angleBetween({ x: 0, y: 0 }, { x: 1, y: 0 })).toBeCloseTo(0)
    expect(angleBetween({ x: 0, y: 0 }, { x: 0, y: 1 })).toBeCloseTo(Math.PI / 2)
  })

  test('projectPointToSegment - perpendicular', () => {
    const r = projectPointToSegment({ x: 5, y: 3 }, { x: 0, y: 0 }, { x: 10, y: 0 })
    expect(r.x).toBeCloseTo(5)
    expect(r.y).toBeCloseTo(0)
    expect(r.t).toBeCloseTo(0.5)
  })

  test('projectPointToSegment - clamps past end', () => {
    const r = projectPointToSegment({ x: 15, y: 3 }, { x: 0, y: 0 }, { x: 10, y: 0 })
    expect(r.t).toBeCloseTo(1)
    expect(r.x).toBeCloseTo(10)
  })

  test('projectPointToSegment - zero-length segment', () => {
    const r = projectPointToSegment({ x: 5, y: 5 }, { x: 2, y: 2 }, { x: 2, y: 2 })
    expect(r.x).toBeCloseTo(2)
    expect(r.t).toBe(0)
  })

  test('clamp', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(11, 0, 10)).toBe(10)
  })

  test('pointAlongSegment', () => {
    const r = pointAlongSegment({ x: 0, y: 0 }, { x: 10, y: 0 }, 5)
    expect(r.x).toBeCloseTo(5)
    expect(r.y).toBeCloseTo(0)
  })

  test('snapValue rounds to nearest', () => {
    expect(snapValue(155, 100)).toBe(200)
    expect(snapValue(149, 100)).toBe(100)
    expect(snapValue(150, 100)).toBe(200)
  })

  test('snapValue with zero spacing returns value unchanged', () => {
    expect(snapValue(155, 0)).toBe(155)
  })

  test('snapPoint', () => {
    expect(snapPoint({ x: 155, y: 249 }, 100)).toEqual({ x: 200, y: 200 })
  })

  test('formatDistance under 1000mm', () => {
    expect(formatDistance(850)).toBe('850 mm')
    expect(formatDistance(0)).toBe('0 mm')
  })

  test('formatDistance 1000mm and above', () => {
    expect(formatDistance(1200)).toBe('1.20 m')
    expect(formatDistance(1000)).toBe('1.00 m')
  })

  test('constrainAngle snaps to 45° steps', () => {
    const end = constrainAngle(
      { x: 0, y: 0 },
      { x: Math.cos((40 * Math.PI) / 180) * 10, y: Math.sin((40 * Math.PI) / 180) * 10 },
      45,
    )
    const deg = (Math.atan2(end.y, end.x) * 180) / Math.PI
    expect(deg).toBeCloseTo(45)
  })
})
```

- [ ] **Step 2: Run — confirm all fail**

```bash
npx vitest run src/utils/geometry.test.ts
```

Expected: all tests fail with "Cannot find module './geometry'"

- [ ] **Step 3: Implement**

```ts
// src/utils/geometry.ts

export type Point = { x: number; y: number }

export function distance(a: Point, b: Point): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2)
}

export function angleBetween(a: Point, b: Point): number {
  return Math.atan2(b.y - a.y, b.x - a.x)
}

export function projectPointToSegment(
  point: Point,
  start: Point,
  end: Point,
): Point & { t: number } {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const len2 = dx * dx + dy * dy
  if (len2 === 0) return { ...start, t: 0 }
  const t = clamp(
    ((point.x - start.x) * dx + (point.y - start.y) * dy) / len2,
    0,
    1,
  )
  return { x: start.x + t * dx, y: start.y + t * dy, t }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function pointAlongSegment(start: Point, end: Point, offsetMm: number): Point {
  const len = distance(start, end)
  if (len === 0) return { ...start }
  const t = offsetMm / len
  return { x: start.x + t * (end.x - start.x), y: start.y + t * (end.y - start.y) }
}

export function snapValue(value: number, spacing: number): number {
  if (spacing <= 0) return value
  return Math.round(value / spacing) * spacing
}

export function snapPoint(point: Point, spacing: number): Point {
  return { x: snapValue(point.x, spacing), y: snapValue(point.y, spacing) }
}

export function formatDistance(mm: number): string {
  if (mm < 1000) return `${Math.round(mm)} mm`
  return `${(mm / 1000).toFixed(2)} m`
}

export function constrainAngle(start: Point, end: Point, stepDeg: number): Point {
  const angle = angleBetween(start, end)
  const len = distance(start, end)
  const step = (stepDeg * Math.PI) / 180
  const snapped = Math.round(angle / step) * step
  return { x: start.x + len * Math.cos(snapped), y: start.y + len * Math.sin(snapped) }
}
```

- [ ] **Step 4: Run — confirm all pass**

```bash
npx vitest run src/utils/geometry.test.ts
```

Expected: 13 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/utils/geometry.ts src/utils/geometry.test.ts
git commit -m "feat: add geometry utility functions"
```

---

## Task 2: Types and Schema Migration

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/utils/projectIO.ts`
- Modify: `src/utils/projectIO.test.ts`

**Interfaces:**
- Consumes: `SCHEMA_VERSION` from store (will be 2 after Task 3)
- Produces: `GridSettings`, `SnapSettings`, `WallSegment`, `DoorObject`, `WindowObject`, `DimensionAnnotation`, `AnyObject`, `ActiveTool`, `isFloorObject`, `isWallSegment`, `isDoorObject`, `isWindowObject`, `isDimensionAnnotation`

---

- [ ] **Step 1: Add new types to `src/types/index.ts`**

After the existing `FloorObject` interface, add:

```ts
export type ActiveTool = 'select' | 'dimension' | 'wall' | 'door' | 'window'

export interface GridSettings {
  enabled: boolean
  minorSpacingMm: number
  majorSpacingMm: number
  showMinor: boolean
  showMajor: boolean
}

export interface SnapSettings {
  enabled: boolean
  spacingMm: number
}

export interface WallSegment {
  type: 'wall'
  id: string
  name: string
  start: { x: number; y: number }
  end: { x: number; y: number }
  thicknessMm: number
  heightMm?: number
  layerId?: string
  locked?: boolean
  visible?: boolean
  stroke?: string
  fill?: string
  memo?: string
}

export interface DoorObject {
  type: 'door'
  id: string
  name: string
  wallId: string
  offsetMm: number
  widthMm: number
  swingDirection: 'left' | 'right'
  swingAngleDeg: number
  layerId?: string
  locked?: boolean
  visible?: boolean
  memo?: string
}

export interface WindowObject {
  type: 'window'
  id: string
  name: string
  wallId: string
  offsetMm: number
  widthMm: number
  layerId?: string
  locked?: boolean
  visible?: boolean
  memo?: string
}

export interface DimensionAnnotation {
  type: 'dimension'
  id: string
  name?: string
  start: { x: number; y: number }
  end: { x: number; y: number }
  offsetMm?: number
  layerId?: string
  locked?: boolean
  visible?: boolean
  memo?: string
}

export type AnyObject =
  | FloorObject
  | WallSegment
  | DoorObject
  | WindowObject
  | DimensionAnnotation

// Type guards
export function isFloorObject(obj: AnyObject): obj is FloorObject {
  return 'shapeType' in obj
}
export function isWallSegment(obj: AnyObject): obj is WallSegment {
  return (obj as WallSegment).type === 'wall'
}
export function isDoorObject(obj: AnyObject): obj is DoorObject {
  return (obj as DoorObject).type === 'door'
}
export function isWindowObject(obj: AnyObject): obj is WindowObject {
  return (obj as WindowObject).type === 'window'
}
export function isDimensionAnnotation(obj: AnyObject): obj is DimensionAnnotation {
  return (obj as DimensionAnnotation).type === 'dimension'
}
```

Also update `CanvasSettings` to add `grid` and `snap`:

```ts
export interface CanvasSettings {
  image: FloorPlanImage | null
  pixelsPerMm: number | null
  grid: GridSettings
  snap: SnapSettings
}
```

And update `FloorLayout`:

```ts
export interface FloorLayout {
  id: string
  name: string
  objects: AnyObject[]   // was FloorObject[]
  layers: FloorLayer[]
  canvas: CanvasSettings
  memo?: string
}
```

- [ ] **Step 2: Add migration tests to `src/utils/projectIO.test.ts`**

Add at end of the existing test file:

```ts
describe('schema migration v1 → v2', () => {
  test('injects grid and snap defaults when missing', () => {
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

  test('round-trip preserves WallSegment', () => {
    const wall: WallSegment = {
      type: 'wall', id: 'w1', name: 'Wall 1',
      start: { x: 0, y: 0 }, end: { x: 1000, y: 0 },
      thicknessMm: 100,
    }
    // Build a minimal valid v2 project
    const proj = makeDefaultProject()
    proj.layouts[0].objects.push(wall)
    const json = exportProject(proj)
    const loaded = loadProject(json)
    const loaded_wall = loaded.layouts[0].objects.find(o => o.id === 'w1')
    expect(loaded_wall).toBeDefined()
    expect(isWallSegment(loaded_wall!)).toBe(true)
  })
})
```

Add imports at top: `import { WallSegment, isWallSegment } from '../types'` and `import { makeDefaultProject } from '../store/store'`

- [ ] **Step 3: Run — confirm new tests fail**

```bash
npx vitest run src/utils/projectIO.test.ts
```

Expected: migration tests fail; existing tests may also fail due to type changes (fix those in step 4)

- [ ] **Step 4: Update `src/utils/projectIO.ts` to implement v1→v2 migration**

Update `SCHEMA_VERSION` import (will come from store after Task 3 — temporarily set `const SCHEMA_VERSION = 2` at top of the file if needed, or update store first).

Replace the `migrateProject` function:

```ts
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

export function migrateProject(
  raw: Record<string, unknown>,
  fromVersion: number,
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
```

Add imports at top: `import type { GridSettings, SnapSettings } from '../types'`

- [ ] **Step 5: Run — all tests pass**

```bash
npx vitest run src/utils/projectIO.test.ts
```

Expected: all tests pass (migration + existing)

- [ ] **Step 6: Build check**

```bash
npm run build
```

Fix any TypeScript errors from type changes (mostly `FloorObject[]` → `AnyObject[]` in existing code).

- [ ] **Step 7: Commit**

```bash
git add src/types/index.ts src/utils/projectIO.ts src/utils/projectIO.test.ts
git commit -m "feat: add phase 2 types and schema v1→v2 migration"
```

---

## Task 3: Store Updates

**Files:**
- Modify: `src/store/store.ts`
- Modify: `src/store/store.test.ts`

**Interfaces:**
- Consumes: `AnyObject`, `WallSegment`, `DoorObject`, `WindowObject`, `DimensionAnnotation`, `GridSettings`, `SnapSettings` from types
- Produces: `setGridSettings`, `setSnapSettings`, `addAnyObject`, `deleteWall` store actions; updated `updateObject` and `addObject` signatures; `SCHEMA_VERSION = 2`; default grid/snap in `makeDefaultLayout`

---

- [ ] **Step 1: Write new store tests**

Add at end of `src/store/store.test.ts`:

```ts
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
```

Add imports at top: `import { WallSegment, DoorObject, activeLayout } from '../types'` (adjust as needed — `activeLayout` is exported from store, not types).

Note: `createTestStore` is a helper already in the test file; add imports for new types.

- [ ] **Step 2: Run — confirm new tests fail**

```bash
npx vitest run src/store/store.test.ts
```

- [ ] **Step 3: Update `src/store/store.ts`**

**a) Bump SCHEMA_VERSION:**
```ts
export const SCHEMA_VERSION = 2
```

**b) Update `makeDefaultLayout` to include grid/snap defaults:**
```ts
function makeDefaultLayout(name: string): FloorLayout {
  return {
    id: crypto.randomUUID(),
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
    memo: undefined,
  }
}
```

**c) Add to the store interface (after existing action signatures):**
```ts
setGridSettings: (patch: Partial<GridSettings>) => void
setSnapSettings: (patch: Partial<SnapSettings>) => void
addAnyObject: (obj: AnyObject) => void
deleteWall: (wallId: string) => void
```

**d) Update `updateObject` signature:**
```ts
// Change from: updateObject: (objectId: string, patch: Partial<FloorObject>) => void
// To:
updateObject: (objectId: string, patch: Partial<AnyObject>) => void
```

**e) Add implementations (in the store `create()(...)` body):**
```ts
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
```

**f) Add missing imports at top of store.ts:**
```ts
import type { GridSettings, SnapSettings, AnyObject, DoorObject, WindowObject } from '../types'
```

- [ ] **Step 4: Run all tests**

```bash
npm test
```

Expected: all pass. Fix any `Partial<FloorObject>` → `Partial<AnyObject>` TS errors in existing test helpers.

- [ ] **Step 5: Commit**

```bash
git add src/store/store.ts src/store/store.test.ts
git commit -m "feat: store - add grid/snap actions, AnyObject support, deleteWall cascade"
```

---

## Task 4: Grid Overlay

**Files:**
- Create: `src/components/canvas/GridOverlay.tsx`
- Modify: `src/components/canvas/FloorPlanCanvas.tsx`

**Interfaces:**
- Consumes: `GridSettings` from types; `zoom`, `panX`, `panY` from FloorPlanCanvas local state
- Produces: visible SVG grid; `activeTool` prop + `onWorldMouseDown`/`onWorldMouseMove` callbacks + `drawingPreview` slot added to FloorPlanCanvas

Note: This task also extends FloorPlanCanvas with the drawing API used by Tasks 7–9.

---

- [ ] **Step 1: Create `src/components/canvas/GridOverlay.tsx`**

```tsx
import React from 'react'
import type { GridSettings } from '../../types'

interface Props {
  grid: GridSettings
  zoom: number
  panX: number
  panY: number
  svgWidth: number
  svgHeight: number
}

export function GridOverlay({ grid, zoom, panX, panY, svgWidth, svgHeight }: Props) {
  if (!grid.enabled) return null

  const minorPx = grid.minorSpacingMm * zoom
  const majorPx = grid.majorSpacingMm * zoom
  const minorOx = ((panX % minorPx) + minorPx) % minorPx
  const minorOy = ((panY % minorPx) + minorPx) % minorPx
  const majorOx = ((panX % majorPx) + majorPx) % majorPx
  const majorOy = ((panY % majorPx) + majorPx) % majorPx

  return (
    <g style={{ pointerEvents: 'none' }}>
      <defs>
        {grid.showMinor && (
          <pattern
            id="fp-grid-minor"
            x={minorOx}
            y={minorOy}
            width={minorPx}
            height={minorPx}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${minorPx} 0 L 0 0 0 ${minorPx}`}
              fill="none"
              stroke="#d0d0d0"
              strokeWidth={0.5}
            />
          </pattern>
        )}
        {grid.showMajor && (
          <pattern
            id="fp-grid-major"
            x={majorOx}
            y={majorOy}
            width={majorPx}
            height={majorPx}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${majorPx} 0 L 0 0 0 ${majorPx}`}
              fill="none"
              stroke="#a0a0a0"
              strokeWidth={1}
            />
          </pattern>
        )}
      </defs>
      {grid.showMinor && (
        <rect width={svgWidth} height={svgHeight} fill="url(#fp-grid-minor)" />
      )}
      {grid.showMajor && (
        <rect width={svgWidth} height={svgHeight} fill="url(#fp-grid-major)" />
      )}
    </g>
  )
}
```

- [ ] **Step 2: Update `src/components/canvas/FloorPlanCanvas.tsx`**

Add imports:
```ts
import { GridOverlay } from './GridOverlay'
import { useStore, activeLayout } from '../../store/store'
import type { ActiveTool } from '../../types'
```

Update Props interface:
```ts
interface Props {
  svgRef: React.RefObject<SVGSVGElement | null>
  calibrating: boolean
  onCalibrationPoint: (pt: { svgX: number; svgY: number; screenX: number; screenY: number }) => void
  activeTool: ActiveTool
  onWorldMouseDown?: (worldPt: { x: number; y: number }, e: React.MouseEvent) => void
  onWorldMouseMove?: (worldPt: { x: number; y: number }, e: React.MouseEvent) => void
  onWorldMouseUp?: (worldPt: { x: number; y: number }, e: React.MouseEvent) => void
  drawingPreview?: React.ReactNode
}
```

Add a `screenToWorld` helper inside the component:
```ts
const screenToWorld = useCallback((e: React.MouseEvent) => {
  const rect = svgRef.current?.getBoundingClientRect()
  if (!rect) return null
  return {
    x: (e.clientX - rect.left - panX) / zoom,
    y: (e.clientY - rect.top - panY) / zoom,
  }
}, [svgRef, panX, panY, zoom])
```

Update `handleMouseDown` to handle drawing tools:
```ts
const handleMouseDown = useCallback((e: React.MouseEvent) => {
  if (activeTool !== 'select' && activeTool !== 'select') {
    // drawing tools handle pointer events; no pan
    if (onWorldMouseDown) {
      const pt = screenToWorld(e)
      if (pt) onWorldMouseDown(pt, e)
    }
    return
  }
  // Middle mouse or alt+left = pan (existing logic)
  if (e.button === 1 || (e.button === 0 && e.altKey)) {
    isPanning.current = true
    lastPan.current = { x: e.clientX, y: e.clientY }
  }
}, [activeTool, onWorldMouseDown, screenToWorld])
```

Similarly wire `onWorldMouseMove` into `handleMouseMove` when not panning and `activeTool !== 'select'`:
```ts
const handleMouseMove = useCallback((e: React.MouseEvent) => {
  if (activeTool !== 'select' && onWorldMouseMove) {
    const pt = screenToWorld(e)
    if (pt) onWorldMouseMove(pt, e)
    return
  }
  if (!isPanning.current) return
  // existing pan logic
  const dx = e.clientX - lastPan.current.x
  const dy = e.clientY - lastPan.current.y
  lastPan.current = { x: e.clientX, y: e.clientY }
  setPanX(px => px + dx / zoom)
  setPanY(py => py + dy / zoom)
}, [activeTool, onWorldMouseMove, screenToWorld, zoom])
```

Read canvas settings from store for grid:
```ts
const canvas = useStore(s => activeLayout(s.project).canvas)
```

Add `[svgWidth, svgHeight]` state (or use a ResizeObserver or just use 100%):
```ts
const [svgSize, setSvgSize] = useState({ w: 800, h: 600 })
// In a useEffect, measure svgRef.current.getBoundingClientRect()
```

Or simpler: pass `width="100%"` to the patterns rect and use a fixed large size. For simplicity use `width={9999} height={9999}` for the pattern coverage rect.

In JSX, add GridOverlay before the transform group and drawingPreview inside:
```tsx
<svg ref={svgRef} ...>
  <GridOverlay
    grid={canvas.grid}
    zoom={zoom}
    panX={panX}
    panY={panY}
    svgWidth={9999}
    svgHeight={9999}
  />
  <g transform={`translate(${panX},${panY}) scale(${zoom})`}>
    {/* existing content */}
    {drawingPreview}
    <CalibrationOverlay ... />
  </g>
</svg>
```

Update call sites in `App.tsx` to pass `activeTool` (default `'select'` until Task 11 adds the state):
```tsx
// In App.tsx, temporarily:
<FloorPlanCanvas
  svgRef={svgRef}
  calibrating={calibrating}
  onCalibrationPoint={handleCalibrationPoint}
  activeTool="select"
/>
```

- [ ] **Step 3: Build check**

```bash
npm run build
```

Fix any type errors.

- [ ] **Step 4: Manual test**

Run `npm run dev`. Grid should be visible on load. Pan — grid should follow. Zoom — grid should scale. Existing objects should render on top of grid.

- [ ] **Step 5: Commit**

```bash
git add src/components/canvas/GridOverlay.tsx src/components/canvas/FloorPlanCanvas.tsx src/App.tsx
git commit -m "feat: grid overlay + FloorPlanCanvas drawing API"
```

---

## Task 5: Snap Integration

**Files:**
- Modify: `src/components/canvas/PlacedObject.tsx`

**Interfaces:**
- Consumes: `snapPoint`, `snapValue` from `src/utils/geometry.ts`; `snap: SnapSettings` from store via prop
- Produces: snapped drag and resize in PlacedObject; Alt key bypasses snap

---

- [ ] **Step 1: Update `src/components/canvas/PlacedObject.tsx`**

Add snap prop:
```ts
interface Props {
  // existing props...
  snapSpacingMm: number  // 0 = disabled
}
```

Import:
```ts
import { snapPoint, snapValue } from '../../utils/geometry'
```

In drag handler (mouseMove), after computing new `x`/`y` from delta:
```ts
// After computing rawX, rawY:
const snapped = e.altKey ? { x: rawX, y: rawY } : snapPoint({ x: rawX, y: rawY }, snapSpacingMm)
updateObject(obj.id, { x: snapped.x, y: snapped.y })
```

In resize handler (8 handles), after computing `newWidth`/`newDepth`/`newX`/`newY`:
```ts
const snappedW = e.altKey ? newWidth : snapValue(newWidth, snapSpacingMm)
const snappedD = e.altKey ? newDepth : snapValue(newDepth, snapSpacingMm)
const snappedX = e.altKey ? newX : snapValue(newX, snapSpacingMm)
const snappedY = e.altKey ? newY : snapValue(newY, snapSpacingMm)
updateObject(obj.id, { x: snappedX, y: snappedY, width: snappedW, depth: snappedD })
```

In `App.tsx`, pass `snapSpacingMm` to PlacedObject:
```tsx
// Read from store
const canvas = useStore(s => activeLayout(s.project).canvas)
// In FloorPlanCanvas render (or pass through props):
snapSpacingMm={canvas.snap.enabled ? canvas.snap.spacingMm : 0}
```

Note: PlacedObject is rendered inside FloorPlanCanvas. Either pass `snapSpacingMm` as a prop through FloorPlanCanvas → PlacedObject, or have FloorPlanCanvas read it from the store directly.

**Recommended:** Have FloorPlanCanvas read `snap` from store and pass `snapSpacingMm` to each `PlacedObject`.

- [ ] **Step 2: Build and test**

```bash
npm run build && npm test
```

- [ ] **Step 3: Manual test**

Move an object — it should snap to grid. Hold Alt — snap should be bypassed. Resize — dimensions snap. Go to store (browser console): `useStore.getState().setSnapSettings({enabled: false})` — snap disabled globally.

- [ ] **Step 4: Commit**

```bash
git add src/components/canvas/PlacedObject.tsx src/components/canvas/FloorPlanCanvas.tsx
git commit -m "feat: snap-to-grid for object drag and resize"
```

---

## Task 6: Selected-Object Dimension Labels

**Files:**
- Create: `src/components/canvas/DimensionLabel.tsx`
- Modify: `src/components/canvas/FloorPlanCanvas.tsx`

**Interfaces:**
- Consumes: `FloorObject` (selected), `zoom` from FloorPlanCanvas
- Produces: inline SVG dimension text overlay on selected object; not exported

---

- [ ] **Step 1: Create `src/components/canvas/DimensionLabel.tsx`**

```tsx
import React from 'react'
import { formatDistance } from '../../utils/geometry'
import type { FloorObject } from '../../types'

interface Props {
  obj: FloorObject
  zoom: number
}

export function DimensionLabel({ obj, zoom }: Props) {
  const cx = obj.x + obj.width / 2
  const cy = obj.y + obj.depth / 2
  const labelW = formatDistance(obj.width)
  const labelD = formatDistance(obj.depth)
  const line1 = `${labelW} × ${labelD}`
  const line2 = obj.rotation !== 0 ? `${obj.rotation.toFixed(0)}°` : null
  // Font size in world units so it scales with zoom inverse
  const fontSize = 14 / zoom

  return (
    <g style={{ pointerEvents: 'none' }}>
      <text
        x={cx}
        y={cy - (line2 ? fontSize * 0.7 : 0)}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={fontSize}
        fill="#1a1a1a"
        stroke="white"
        strokeWidth={fontSize * 0.15}
        paintOrder="stroke"
      >
        {line1}
      </text>
      {line2 && (
        <text
          x={cx}
          y={cy + fontSize * 0.9}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={fontSize * 0.85}
          fill="#555"
          stroke="white"
          strokeWidth={fontSize * 0.12}
          paintOrder="stroke"
        >
          {line2}
        </text>
      )}
    </g>
  )
}
```

- [ ] **Step 2: Wire into FloorPlanCanvas**

In FloorPlanCanvas, import `DimensionLabel` and `isFloorObject`.

Inside the transform group, after the selected `PlacedObject`, render the label:
```tsx
{selectedObj && isFloorObject(selectedObj) && (
  <DimensionLabel obj={selectedObj} zoom={zoom} />
)}
```

Where `selectedObj` is looked up via `useStore(s => { const layout = activeLayout(s.project); return layout.objects.find(o => o.id === s.selectedObjectId) ?? null })`.

- [ ] **Step 3: Build and test**

```bash
npm run build && npm test
```

- [ ] **Step 4: Manual test**

Select a rectangle. Dimensions appear. Resize — dimensions update immediately. Rotate — rotation angle shows. Deselect — labels disappear. Zoom in/out — labels remain readable.

- [ ] **Step 5: Commit**

```bash
git add src/components/canvas/DimensionLabel.tsx src/components/canvas/FloorPlanCanvas.tsx
git commit -m "feat: selected-object dimension labels"
```

---

## Task 7: Dimension Annotation Tool

**Files:**
- Create: `src/components/canvas/DimensionLine.tsx`
- Modify: `src/App.tsx`
- Modify: `src/utils/exportSVG.ts`
- Modify: `src/store/store.test.ts` (for addAnyObject with DimensionAnnotation)

**Interfaces:**
- Consumes: `DimensionAnnotation` type; `addAnyObject`, `deleteObject`, `updateObject` from store; `onWorldMouseDown`, `onWorldMouseMove`, `drawingPreview` from FloorPlanCanvas
- Produces: DimensionLine renderer (selectable, deletable); 2-click draw in App; SVG export of dimension lines

---

- [ ] **Step 1: Create `src/components/canvas/DimensionLine.tsx`**

```tsx
import React from 'react'
import { distance, formatDistance } from '../../utils/geometry'
import type { DimensionAnnotation } from '../../types'

interface Props {
  dim: DimensionAnnotation
  selected: boolean
  zoom: number
  onSelect: () => void
}

export function DimensionLine({ dim, selected, zoom, onSelect }: Props) {
  const { start, end } = dim
  const mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 }
  const len = distance(start, end)
  const label = formatDistance(len)
  const angle = Math.atan2(end.y - start.y, end.x - start.x)
  const tickLen = 8 / zoom
  const fontSize = 12 / zoom
  const strokeW = 1.5 / zoom

  // Tick at start
  const tickSx = Math.cos(angle + Math.PI / 2) * tickLen
  const tickSy = Math.sin(angle + Math.PI / 2) * tickLen

  return (
    <g
      style={{ cursor: 'pointer', pointerEvents: 'all' }}
      onClick={onSelect}
    >
      {/* Invisible wide hit area */}
      <line
        x1={start.x} y1={start.y} x2={end.x} y2={end.y}
        stroke="transparent" strokeWidth={12 / zoom}
      />
      {/* Dimension line */}
      <line
        x1={start.x} y1={start.y} x2={end.x} y2={end.y}
        stroke={selected ? '#0078d4' : '#333'}
        strokeWidth={strokeW}
        markerEnd="url(#dim-arrow)"
        markerStart="url(#dim-arrow)"
      />
      {/* Ticks at endpoints */}
      <line
        x1={start.x - tickSx} y1={start.y - tickSy}
        x2={start.x + tickSx} y2={start.y + tickSy}
        stroke={selected ? '#0078d4' : '#333'} strokeWidth={strokeW}
      />
      <line
        x1={end.x - tickSx} y1={end.y - tickSy}
        x2={end.x + tickSx} y2={end.y + tickSy}
        stroke={selected ? '#0078d4' : '#333'} strokeWidth={strokeW}
      />
      {/* Label background */}
      <rect
        x={mid.x - (label.length * fontSize * 0.3)}
        y={mid.y - fontSize * 0.75}
        width={label.length * fontSize * 0.6}
        height={fontSize * 1.4}
        fill="white"
        fillOpacity={0.85}
        rx={2 / zoom}
      />
      {/* Label text */}
      <text
        x={mid.x} y={mid.y}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={fontSize}
        fill={selected ? '#0078d4' : '#111'}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {label}
      </text>
    </g>
  )
}
```

Note: SVG markers (`dim-arrow`) should be defined once in a `<defs>` block in FloorPlanCanvas.

- [ ] **Step 2: Add SVG arrow marker defs to FloorPlanCanvas**

Inside the `<svg>` element, before GridOverlay:
```tsx
<defs>
  <marker id="dim-arrow" markerWidth={6} markerHeight={6} refX={3} refY={3} orient="auto">
    <path d="M 0 0 L 6 3 L 0 6 z" fill="#333" />
  </marker>
</defs>
```

- [ ] **Step 3: Add dimension drawing state to `App.tsx`**

```ts
// Drawing state for dimension tool
const [dimStart, setDimStart] = useState<{ x: number; y: number } | null>(null)
const [dimPreviewEnd, setDimPreviewEnd] = useState<{ x: number; y: number } | null>(null)

const addAnyObject = useStore(s => s.addAnyObject)
const snap = useStore(s => activeLayout(s.project).canvas.snap)

const handleWorldMouseDown = useCallback((worldPt: { x: number; y: number }) => {
  if (activeTool === 'dimension') {
    const pt = snap.enabled ? snapPoint(worldPt, snap.spacingMm) : worldPt
    if (!dimStart) {
      setDimStart(pt)
    } else {
      const dim: DimensionAnnotation = {
        type: 'dimension',
        id: crypto.randomUUID(),
        start: dimStart,
        end: pt,
      }
      addAnyObject(dim)
      setDimStart(null)
      setDimPreviewEnd(null)
    }
  }
  // wall, door, window handlers added in Tasks 8–9
}, [activeTool, dimStart, snap, addAnyObject])

const handleWorldMouseMove = useCallback((worldPt: { x: number; y: number }) => {
  if (activeTool === 'dimension' && dimStart) {
    const pt = snap.enabled ? snapPoint(worldPt, snap.spacingMm) : worldPt
    setDimPreviewEnd(pt)
  }
}, [activeTool, dimStart, snap])
```

Drawing preview (pass to FloorPlanCanvas as `drawingPreview`):
```tsx
const dimensionPreview = activeTool === 'dimension' && dimStart && dimPreviewEnd ? (
  <DimensionLine
    dim={{ type: 'dimension', id: 'preview', start: dimStart, end: dimPreviewEnd }}
    selected={false}
    zoom={1}  // zoom passed from FloorPlanCanvas — see note below
    onSelect={() => {}}
  />
) : null
```

Note: `zoom` from FloorPlanCanvas is internal state. For the preview, expose zoom via a callback or accept that the preview labels won't scale perfectly (acceptable for preview). Alternatively, expose zoom via a `onZoomChange` callback. For simplicity, store zoom in a `useRef` that FloorPlanCanvas updates via `onZoomChange(zoom)`.

Add to FloorPlanCanvas Props: `onZoomChange?: (zoom: number) => void` and call it whenever zoom changes.

In App.tsx:
```ts
const zoomRef = useRef(1)
// ...
onZoomChange={(z) => { zoomRef.current = z }}
```

Pass `zoom={zoomRef.current}` to DimensionLine preview.

- [ ] **Step 4: Render DimensionLine objects in FloorPlanCanvas**

In FloorPlanCanvas, inside the transform group, render dimension annotations:
```tsx
{layout.objects.filter(isDimensionAnnotation).map(dim => (
  <DimensionLine
    key={dim.id}
    dim={dim}
    selected={selectedObjectId === dim.id}
    zoom={zoom}
    onSelect={() => setSelectedObjectId(dim.id)}
  />
))}
```

Import `isDimensionAnnotation` from types.

Also: Delete dimension on `Delete`/`Backspace` key — add to the `handleKeyDown` in `App.tsx`:
```ts
if (e.key === 'Delete' || e.key === 'Backspace') {
  if (selectedObjectId) deleteObject(selectedObjectId)
}
```

Handle Esc to cancel dimension drawing:
```ts
if (e.key === 'Escape') {
  setDimStart(null)
  setDimPreviewEnd(null)
  setActiveTool('select')
}
```

- [ ] **Step 5: Update SVG export**

In `src/utils/exportSVG.ts`, add dimension line rendering to the SVG export function:

```ts
import { distance, formatDistance } from './geometry'
import type { DimensionAnnotation, AnyObject } from '../types'
import { isDimensionAnnotation } from '../types'

// In the export loop over objects:
if (isDimensionAnnotation(obj)) {
  const { start, end } = obj
  const mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 }
  const label = formatDistance(distance(start, end))
  svg += `<line x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}" stroke="#333" stroke-width="1.5"/>\n`
  svg += `<text x="${mid.x}" y="${mid.y}" text-anchor="middle" dominant-baseline="middle" font-size="12" fill="#111">${label}</text>\n`
}
```

- [ ] **Step 6: Build and test**

```bash
npm run build && npm test
```

- [ ] **Step 7: Manual test**

Select Dimension tool. Click once → first point indicator. Move mouse → preview line + distance. Click again → annotation created. Select annotation → highlighted. Press Delete → removed. JSON export/import round-trip.

- [ ] **Step 8: Commit**

```bash
git add src/components/canvas/DimensionLine.tsx src/App.tsx src/components/canvas/FloorPlanCanvas.tsx src/utils/exportSVG.ts
git commit -m "feat: dimension annotation tool - draw, render, export"
```

---

## Task 8: Wall Drawing Tool

**Files:**
- Create: `src/components/canvas/WallSegmentRenderer.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/canvas/FloorPlanCanvas.tsx`
- Modify: `src/utils/exportSVG.ts`

**Interfaces:**
- Consumes: `WallSegment`, `isWallSegment`; `addAnyObject`, `updateObject`, `deleteWall` from store; `constrainAngle`, `snapPoint` from geometry
- Produces: wall renderer with endpoint handles; continuous draw mode; SVG export

---

- [ ] **Step 1: Create `src/components/canvas/WallSegmentRenderer.tsx`**

```tsx
import React, { useState } from 'react'
import type { WallSegment } from '../../types'

interface Props {
  wall: WallSegment
  selected: boolean
  zoom: number
  onSelect: () => void
  onUpdate: (patch: Partial<WallSegment>) => void
}

export function WallSegmentRenderer({ wall, selected, zoom, onSelect, onUpdate }: Props) {
  const { start, end, thicknessMm, fill, stroke } = wall
  const [draggingHandle, setDraggingHandle] = useState<'start' | 'end' | 'body' | null>(null)
  const [dragOrigin, setDragOrigin] = useState({ x: 0, y: 0 })
  const [wallOrigin, setWallOrigin] = useState<{ start: typeof start; end: typeof end } | null>(null)

  const handleRadius = 6 / zoom
  const hitWidth = Math.max(thicknessMm, 10 / zoom)

  const onHandleMouseDown = (handle: 'start' | 'end' | 'body', e: React.MouseEvent) => {
    e.stopPropagation()
    setDraggingHandle(handle)
    setDragOrigin({ x: e.clientX, y: e.clientY })
    setWallOrigin({ start: { ...start }, end: { ...end } })
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!draggingHandle || !wallOrigin) return
    const dx = (e.clientX - dragOrigin.x) / zoom
    const dy = (e.clientY - dragOrigin.y) / zoom
    if (draggingHandle === 'start') {
      onUpdate({ start: { x: wallOrigin.start.x + dx, y: wallOrigin.start.y + dy } })
    } else if (draggingHandle === 'end') {
      onUpdate({ end: { x: wallOrigin.end.x + dx, y: wallOrigin.end.y + dy } })
    } else {
      onUpdate({
        start: { x: wallOrigin.start.x + dx, y: wallOrigin.start.y + dy },
        end: { x: wallOrigin.end.x + dx, y: wallOrigin.end.y + dy },
      })
    }
  }

  const onMouseUp = () => setDraggingHandle(null)

  return (
    <g
      onMouseMove={draggingHandle ? onMouseMove : undefined}
      onMouseUp={draggingHandle ? onMouseUp : undefined}
      onMouseLeave={draggingHandle ? onMouseUp : undefined}
    >
      {/* Hit area */}
      <line
        x1={start.x} y1={start.y} x2={end.x} y2={end.y}
        stroke="transparent"
        strokeWidth={hitWidth}
        style={{ cursor: 'move' }}
        onClick={onSelect}
        onMouseDown={e => onHandleMouseDown('body', e)}
      />
      {/* Wall body */}
      <line
        x1={start.x} y1={start.y} x2={end.x} y2={end.y}
        stroke={stroke ?? '#555'}
        strokeWidth={thicknessMm}
        strokeLinecap="square"
        fill={fill ?? 'none'}
        style={{ pointerEvents: 'none' }}
      />
      {/* Endpoint handles (shown when selected) */}
      {selected && (
        <>
          <circle
            cx={start.x} cy={start.y} r={handleRadius}
            fill="white" stroke="#0078d4" strokeWidth={1.5 / zoom}
            style={{ cursor: 'crosshair' }}
            onMouseDown={e => onHandleMouseDown('start', e)}
          />
          <circle
            cx={end.x} cy={end.y} r={handleRadius}
            fill="white" stroke="#0078d4" strokeWidth={1.5 / zoom}
            style={{ cursor: 'crosshair' }}
            onMouseDown={e => onHandleMouseDown('end', e)}
          />
        </>
      )}
    </g>
  )
}
```

- [ ] **Step 2: Add wall drawing state to `App.tsx`**

```ts
// Wall drawing state
const [wallStart, setWallStart] = useState<{ x: number; y: number } | null>(null)
const [wallPreviewEnd, setWallPreviewEnd] = useState<{ x: number; y: number } | null>(null)
const DEFAULT_WALL_THICKNESS = 100

// Add to handleWorldMouseDown:
if (activeTool === 'wall') {
  let pt = snap.enabled ? snapPoint(worldPt, snap.spacingMm) : worldPt
  if (e.shiftKey && wallStart) pt = constrainAngle(wallStart, pt, 45)
  if (!wallStart) {
    setWallStart(pt)
  } else {
    const wall: WallSegment = {
      type: 'wall',
      id: crypto.randomUUID(),
      name: 'Wall',
      start: wallStart,
      end: pt,
      thicknessMm: DEFAULT_WALL_THICKNESS,
    }
    addAnyObject(wall)
    setWallStart(pt)  // continuous drawing: end becomes next start
  }
}

// Add to handleWorldMouseMove:
if (activeTool === 'wall' && wallStart) {
  let pt = snap.enabled ? snapPoint(worldPt, snap.spacingMm) : worldPt
  if (e.shiftKey) pt = constrainAngle(wallStart, pt, 45)
  setWallPreviewEnd(pt)
}
```

Wall preview in drawingPreview:
```tsx
const wallPreview = activeTool === 'wall' && wallStart && wallPreviewEnd ? (
  <line
    x1={wallStart.x} y1={wallStart.y}
    x2={wallPreviewEnd.x} y2={wallPreviewEnd.y}
    stroke="#0078d4" strokeWidth={DEFAULT_WALL_THICKNESS}
    strokeLinecap="square" opacity={0.5}
    style={{ pointerEvents: 'none' }}
  />
) : null
```

Esc handling: add to existing Esc key handler in `handleKeyDown`:
```ts
if (e.key === 'Escape') {
  setWallStart(null)
  setWallPreviewEnd(null)
  // ...existing dim reset...
  setActiveTool('select')
}
```

- [ ] **Step 3: Render WallSegmentRenderer objects in FloorPlanCanvas**

```tsx
{layout.objects.filter(isWallSegment).map(wall => (
  <WallSegmentRenderer
    key={wall.id}
    wall={wall}
    selected={selectedObjectId === wall.id}
    zoom={zoom}
    onSelect={() => setSelectedObjectId(wall.id)}
    onUpdate={patch => updateObject(wall.id, patch)}
  />
))}
```

- [ ] **Step 4: SVG export for walls**

In `exportSVG.ts`, add:
```ts
if (isWallSegment(obj)) {
  svg += `<line x1="${obj.start.x}" y1="${obj.start.y}" x2="${obj.end.x}" y2="${obj.end.y}" stroke="${obj.stroke ?? '#555'}" stroke-width="${obj.thicknessMm}" stroke-linecap="square"/>\n`
}
```

- [ ] **Step 5: Build and test**

```bash
npm run build && npm test
```

- [ ] **Step 6: Manual test**

Select Wall tool. Click → start point. Move (Shift for 45° snap). Click → segment drawn; next start is set. Draw multiple connected walls. Esc → exits. Select wall → endpoint handles. Drag endpoints. Drag body. JSON round-trip. SVG export includes walls.

- [ ] **Step 7: Commit**

```bash
git add src/components/canvas/WallSegmentRenderer.tsx src/App.tsx src/components/canvas/FloorPlanCanvas.tsx src/utils/exportSVG.ts
git commit -m "feat: wall drawing tool - draw, render, endpoint editing, export"
```

---

## Task 9: Door and Window Placement

**Files:**
- Create: `src/components/canvas/DoorWindowRenderer.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/canvas/FloorPlanCanvas.tsx`
- Modify: `src/utils/exportSVG.ts`

**Interfaces:**
- Consumes: `DoorObject`, `WindowObject`, `isDoorObject`, `isWindowObject`; `WallSegment`, `isWallSegment`; `addAnyObject`, `updateObject`, `deleteObject` from store; `projectPointToSegment`, `pointAlongSegment`, `angleBetween`, `clamp` from geometry
- Produces: door/window renderer (aligned to wall, draggable along wall); placement tool; SVG export

---

- [ ] **Step 1: Create `src/components/canvas/DoorWindowRenderer.tsx`**

```tsx
import React from 'react'
import { pointAlongSegment, angleBetween, distance } from '../../utils/geometry'
import type { DoorObject, WindowObject, WallSegment } from '../../types'

function getTransform(wall: WallSegment, offsetMm: number, widthMm: number) {
  const pos = pointAlongSegment(wall.start, wall.end, offsetMm + widthMm / 2)
  const angle = angleBetween(wall.start, wall.end)
  return { cx: pos.x, cy: pos.y, angleDeg: (angle * 180) / Math.PI }
}

interface DoorProps {
  door: DoorObject
  wall: WallSegment
  selected: boolean
  zoom: number
  onSelect: () => void
  onDrag: (newOffsetMm: number) => void
}

export function DoorRenderer({ door, wall, selected, zoom, onSelect, onDrag }: DoorProps) {
  const { cx, cy, angleDeg } = getTransform(wall, door.offsetMm, door.widthMm)
  const w = door.widthMm
  const hingeSide = door.swingDirection === 'left' ? -1 : 1
  const swingRad = (door.swingAngleDeg * Math.PI) / 180
  const strokeW = 1.5 / zoom

  // Hinge at one end, arc sweep from door leaf
  const hx = -w / 2  // local hinge x
  const leafX = w / 2 * hingeSide
  const arcR = w
  const arcEndX = hx + arcR * Math.cos(swingRad * hingeSide)
  const arcEndY = arcR * Math.sin(swingRad * hingeSide)

  return (
    <g
      transform={`translate(${cx}, ${cy}) rotate(${angleDeg})`}
      style={{ cursor: 'pointer' }}
      onClick={onSelect}
    >
      {/* Hit area */}
      <rect x={-w / 2} y={-w / 2} width={w} height={w} fill="transparent" />
      {/* Door leaf */}
      <line
        x1={hx} y1={0}
        x2={hx + (w * hingeSide)} y2={0}
        stroke={selected ? '#0078d4' : '#555'}
        strokeWidth={strokeW * 2}
      />
      {/* Swing arc */}
      <path
        d={`M ${hx + w * hingeSide} 0 A ${w} ${w} 0 0 ${hingeSide > 0 ? 1 : 0} ${hx + arcEndX} ${arcEndY}`}
        fill="none"
        stroke={selected ? '#0078d4' : '#888'}
        strokeWidth={strokeW}
        strokeDasharray={`${6 / zoom} ${3 / zoom}`}
      />
    </g>
  )
}

interface WindowProps {
  win: WindowObject
  wall: WallSegment
  selected: boolean
  zoom: number
  onSelect: () => void
}

export function WindowRenderer({ win, wall, selected, zoom, onSelect }: WindowProps) {
  const { cx, cy, angleDeg } = getTransform(wall, win.offsetMm, win.widthMm)
  const w = win.widthMm
  const thickness = wall.thicknessMm
  const strokeW = 1.5 / zoom

  return (
    <g
      transform={`translate(${cx}, ${cy}) rotate(${angleDeg})`}
      style={{ cursor: 'pointer' }}
      onClick={onSelect}
    >
      {/* Hit area */}
      <rect x={-w / 2} y={-thickness / 2} width={w} height={thickness} fill="transparent" />
      {/* Window frame - white fill over wall */}
      <rect
        x={-w / 2} y={-thickness / 2}
        width={w} height={thickness}
        fill="white"
        stroke={selected ? '#0078d4' : '#555'}
        strokeWidth={strokeW}
      />
      {/* Glass pane lines */}
      <line x1={0} y1={-thickness / 2} x2={0} y2={thickness / 2}
        stroke={selected ? '#0078d4' : '#88bbdd'} strokeWidth={strokeW} />
    </g>
  )
}
```

- [ ] **Step 2: Add door/window placement state to `App.tsx`**

```ts
// Placement state: hover preview over nearest wall
const [placementPreview, setPlacementPreview] = useState<{
  wallId: string; offsetMm: number; worldPt: { x: number; y: number }
} | null>(null)

const layout = useStore(s => activeLayout(s.project))

function findNearestWall(pt: { x: number; y: number }) {
  let best: { wall: WallSegment; proj: ReturnType<typeof projectPointToSegment> } | null = null
  let bestDist = Infinity
  for (const obj of layout.objects) {
    if (!isWallSegment(obj)) continue
    const proj = projectPointToSegment(pt, obj.start, obj.end)
    const d = distance(pt, proj)
    if (d < bestDist) { bestDist = d; best = { wall: obj, proj } }
  }
  if (!best || bestDist > 200) return null  // 200mm snap radius
  const offsetMm = distance(best.wall.start, best.proj) - 450  // center-450 for door
  return { wallId: best.wall.id, offsetMm: Math.max(0, offsetMm), worldPt: best.proj }
}

// Add to handleWorldMouseMove:
if (activeTool === 'door' || activeTool === 'window') {
  setPlacementPreview(findNearestWall(worldPt))
}

// Add to handleWorldMouseDown:
if (activeTool === 'door' && placementPreview) {
  const wall = layout.objects.find(o => o.id === placementPreview.wallId) as WallSegment
  const wallLen = distance(wall.start, wall.end)
  const door: DoorObject = {
    type: 'door',
    id: crypto.randomUUID(),
    name: 'Door',
    wallId: placementPreview.wallId,
    offsetMm: clamp(placementPreview.offsetMm, 0, wallLen - 900),
    widthMm: 900,
    swingDirection: 'left',
    swingAngleDeg: 90,
  }
  addAnyObject(door)
}
if (activeTool === 'window' && placementPreview) {
  const wall = layout.objects.find(o => o.id === placementPreview.wallId) as WallSegment
  const wallLen = distance(wall.start, wall.end)
  const win: WindowObject = {
    type: 'window',
    id: crypto.randomUUID(),
    name: 'Window',
    wallId: placementPreview.wallId,
    offsetMm: clamp(placementPreview.offsetMm - 600, 0, wallLen - 1200),
    widthMm: 1200,
  }
  addAnyObject(win)
}
```

- [ ] **Step 3: Render in FloorPlanCanvas**

```tsx
{layout.objects.filter(isDoorObject).map(door => {
  const wall = layout.objects.find(o => o.id === door.wallId)
  if (!wall || !isWallSegment(wall)) return null
  return (
    <DoorRenderer
      key={door.id}
      door={door}
      wall={wall}
      selected={selectedObjectId === door.id}
      zoom={zoom}
      onSelect={() => setSelectedObjectId(door.id)}
      onDrag={newOffset => updateObject(door.id, { offsetMm: newOffset })}
    />
  )
})}
{layout.objects.filter(isWindowObject).map(win => {
  const wall = layout.objects.find(o => o.id === win.wallId)
  if (!wall || !isWallSegment(wall)) return null
  return (
    <WindowRenderer
      key={win.id}
      win={win}
      wall={wall}
      selected={selectedObjectId === win.id}
      zoom={zoom}
      onSelect={() => setSelectedObjectId(win.id)}
    />
  )
})}
```

- [ ] **Step 4: SVG export for doors/windows**

```ts
if (isDoorObject(obj)) {
  const wall = objects.find(o => o.id === obj.wallId)
  if (wall && isWallSegment(wall)) {
    const { cx, cy, angleDeg } = getTransformForExport(wall, obj.offsetMm, obj.widthMm)
    svg += `<g transform="translate(${cx}, ${cy}) rotate(${angleDeg})">\n`
    svg += `  <line x1="${-obj.widthMm / 2}" y1="0" x2="${obj.widthMm / 2}" y2="0" stroke="#555" stroke-width="3"/>\n`
    svg += `</g>\n`
  }
}
// similar for window
```

Note: `getTransformForExport` is the same logic as `getTransform` in DoorWindowRenderer — extract to a shared utility in `geometry.ts` if needed.

- [ ] **Step 5: Build and test**

```bash
npm run build && npm test
```

- [ ] **Step 6: Manual test**

Draw a wall. Select Door tool. Hover over the wall — preview appears. Click — door placed. Select Window tool. Click wall — window placed. Door/window follow wall angle. Select door → properties show. Delete removes door. JSON round-trip preserves door. Deleting parent wall also deletes door.

- [ ] **Step 7: Commit**

```bash
git add src/components/canvas/DoorWindowRenderer.tsx src/App.tsx src/components/canvas/FloorPlanCanvas.tsx src/utils/exportSVG.ts
git commit -m "feat: door and window placement tool - render, place, export"
```

---

## Task 10: Properties Panel Updates

**Files:**
- Modify: `src/components/properties/PropertiesPanel.tsx`

**Interfaces:**
- Consumes: `WallSegment`, `DoorObject`, `WindowObject`, `DimensionAnnotation`, `isWallSegment`, `isDoorObject`, `isWindowObject`, `isDimensionAnnotation`; `updateObject`, `deleteWall` from store; `distance`, `angleBetween`, `formatDistance` from geometry
- Produces: correct properties panel for each new object type

---

- [ ] **Step 1: Update `src/components/properties/PropertiesPanel.tsx`**

The existing panel shows properties for `FloorObject`. Extend it to handle new types. Find where `selectedObj` is typed as `FloorObject` and change to `AnyObject | null`.

Add panel sections (below the existing `isFloorObject` block):

```tsx
if (isWallSegment(selectedObj)) {
  const len = distance(selectedObj.start, selectedObj.end)
  const angleDeg = (angleBetween(selectedObj.start, selectedObj.end) * 180) / Math.PI
  return (
    <div className="properties-panel">
      <h3>Wall</h3>
      <label>Name<input value={selectedObj.name}
        onChange={e => updateObject(selectedObj.id, { name: e.target.value })} /></label>
      <label>Length<span>{formatDistance(len)}</span></label>
      <label>Angle<span>{angleDeg.toFixed(1)}°</span></label>
      <label>Thickness (mm)
        <input type="number" value={selectedObj.thicknessMm}
          onChange={e => updateObject(selectedObj.id, { thicknessMm: Number(e.target.value) })} />
      </label>
      <label>Start X<input type="number" value={selectedObj.start.x.toFixed(0)}
        onChange={e => updateObject(selectedObj.id, { start: { ...selectedObj.start, x: Number(e.target.value) } })} /></label>
      <label>Start Y<input type="number" value={selectedObj.start.y.toFixed(0)}
        onChange={e => updateObject(selectedObj.id, { start: { ...selectedObj.start, y: Number(e.target.value) } })} /></label>
      <label>End X<input type="number" value={selectedObj.end.x.toFixed(0)}
        onChange={e => updateObject(selectedObj.id, { end: { ...selectedObj.end, x: Number(e.target.value) } })} /></label>
      <label>End Y<input type="number" value={selectedObj.end.y.toFixed(0)}
        onChange={e => updateObject(selectedObj.id, { end: { ...selectedObj.end, y: Number(e.target.value) } })} /></label>
      <label>Memo<textarea value={selectedObj.memo ?? ''}
        onChange={e => updateObject(selectedObj.id, { memo: e.target.value })} /></label>
      <button onClick={() => deleteWall(selectedObj.id)}>Delete Wall + Attachments</button>
    </div>
  )
}

if (isDimensionAnnotation(selectedObj)) {
  const len = distance(selectedObj.start, selectedObj.end)
  return (
    <div className="properties-panel">
      <h3>Dimension</h3>
      <label>Length<span>{formatDistance(len)}</span></label>
      <label>Name<input value={selectedObj.name ?? ''}
        onChange={e => updateObject(selectedObj.id, { name: e.target.value })} /></label>
      <button onClick={() => deleteObject(selectedObj.id)}>Delete</button>
    </div>
  )
}

if (isDoorObject(selectedObj)) {
  return (
    <div className="properties-panel">
      <h3>Door</h3>
      <label>Name<input value={selectedObj.name}
        onChange={e => updateObject(selectedObj.id, { name: e.target.value })} /></label>
      <label>Width (mm)
        <input type="number" value={selectedObj.widthMm}
          onChange={e => updateObject(selectedObj.id, { widthMm: Number(e.target.value) })} />
      </label>
      <label>Swing
        <select value={selectedObj.swingDirection}
          onChange={e => updateObject(selectedObj.id, { swingDirection: e.target.value as 'left' | 'right' })}>
          <option value="left">Left</option>
          <option value="right">Right</option>
        </select>
      </label>
      <label>Swing Angle (°)
        <input type="number" min={0} max={180} value={selectedObj.swingAngleDeg}
          onChange={e => updateObject(selectedObj.id, { swingAngleDeg: Number(e.target.value) })} />
      </label>
      <button onClick={() => deleteObject(selectedObj.id)}>Delete</button>
    </div>
  )
}

if (isWindowObject(selectedObj)) {
  return (
    <div className="properties-panel">
      <h3>Window</h3>
      <label>Name<input value={selectedObj.name}
        onChange={e => updateObject(selectedObj.id, { name: e.target.value })} /></label>
      <label>Width (mm)
        <input type="number" value={selectedObj.widthMm}
          onChange={e => updateObject(selectedObj.id, { widthMm: Number(e.target.value) })} />
      </label>
      <button onClick={() => deleteObject(selectedObj.id)}>Delete</button>
    </div>
  )
}
```

Import: `deleteWall` from store; `distance`, `angleBetween`, `formatDistance` from geometry; all type guards from types.

- [ ] **Step 2: Build and test**

```bash
npm run build && npm test
```

- [ ] **Step 3: Commit**

```bash
git add src/components/properties/PropertiesPanel.tsx
git commit -m "feat: properties panel for wall, dimension, door, window"
```

---

## Task 11: Toolbar and Keyboard Shortcuts

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/toolbar/Toolbar.tsx`

**Interfaces:**
- Consumes: `activeTool`, `setActiveTool` from App state; `setGridSettings`, `setSnapSettings` from store; `canvas.grid`, `canvas.snap` from store
- Produces: tool buttons (Dimension, Wall, Door, Window); Grid toggle + spacing dropdown; Snap toggle; Esc cancels drawing; Delete deletes selected

---

- [ ] **Step 1: Add `activeTool` state to `App.tsx`**

```ts
const [activeTool, setActiveTool] = useState<ActiveTool>('select')
```

Import `ActiveTool` from types.

Pass to FloorPlanCanvas:
```tsx
<FloorPlanCanvas
  activeTool={activeTool}
  onWorldMouseDown={handleWorldMouseDown}
  onWorldMouseMove={handleWorldMouseMove}
  ...
/>
```

Pass to Toolbar:
```tsx
<Toolbar activeTool={activeTool} onSetTool={setActiveTool} ... />
```

Add `activeTool` switch to change cursor:
```ts
// In FloorPlanCanvas, update cursor style:
style={{ cursor: calibrating ? 'crosshair' : activeTool !== 'select' ? 'crosshair' : isPanning.current ? 'grabbing' : 'default' }}
```

- [ ] **Step 2: Update `src/components/toolbar/Toolbar.tsx`**

Add props:
```ts
activeTool: ActiveTool
onSetTool: (tool: ActiveTool) => void
```

Add to toolbar JSX (in a "Tools" section):
```tsx
<div className="toolbar-section">
  {(['select', 'wall', 'door', 'window', 'dimension'] as ActiveTool[]).map(tool => (
    <button
      key={tool}
      onClick={() => onSetTool(tool)}
      className={activeTool === tool ? 'active' : ''}
      title={tool.charAt(0).toUpperCase() + tool.slice(1)}
    >
      {toolIcon(tool)}
    </button>
  ))}
</div>
```

Add grid/snap controls (reading from store):
```tsx
const canvas = useStore(s => activeLayout(s.project).canvas)
const setGridSettings = useStore(s => s.setGridSettings)
const setSnapSettings = useStore(s => s.setSnapSettings)

// Grid controls:
<button onClick={() => setGridSettings({ enabled: !canvas.grid.enabled })}>
  {canvas.grid.enabled ? 'Grid On' : 'Grid Off'}
</button>
<select
  value={canvas.grid.minorSpacingMm}
  onChange={e => setGridSettings({
    minorSpacingMm: Number(e.target.value),
    majorSpacingMm: Number(e.target.value) * 10,
  })}
>
  {[50, 100, 250, 500, 1000].map(v => (
    <option key={v} value={v}>{v} mm</option>
  ))}
</select>

// Snap controls:
<button onClick={() => setSnapSettings({ enabled: !canvas.snap.enabled })}>
  {canvas.snap.enabled ? 'Snap On' : 'Snap Off'}
</button>
```

Simple `toolIcon` helper:
```ts
function toolIcon(tool: ActiveTool): string {
  const icons: Record<ActiveTool, string> = {
    select: '↖', wall: '▬', door: '🚪', window: '⬜', dimension: '↔',
  }
  return icons[tool]
}
```

- [ ] **Step 3: Update keyboard shortcuts in `App.tsx`**

In the `handleKeyDown` effect:
```ts
// Existing: Ctrl+Z, Ctrl+Y

// Delete selected object
if ((e.key === 'Delete' || e.key === 'Backspace') && selectedObjectId) {
  e.preventDefault()
  const obj = activeLayoutData.objects.find(o => o.id === selectedObjectId)
  if (obj && isWallSegment(obj)) deleteWall(selectedObjectId)
  else deleteObject(selectedObjectId)
  setSelectedObjectId(null)
}

// Esc: cancel drawing tool, return to select
if (e.key === 'Escape') {
  e.preventDefault()
  setActiveTool('select')
  setDimStart(null)
  setDimPreviewEnd(null)
  setWallStart(null)
  setWallPreviewEnd(null)
  setPlacementPreview(null)
}
```

- [ ] **Step 4: Build and test**

```bash
npm run build && npm test
```

- [ ] **Step 5: Manual test**

All 6 tool buttons appear. Clicking tool changes active tool (highlighted). Grid toggle hides/shows grid. Spacing dropdown changes spacing. Snap toggle works. Esc returns to select. Delete removes selected. All existing shortcuts still work.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/components/toolbar/Toolbar.tsx
git commit -m "feat: toolbar tool buttons, grid/snap controls, keyboard shortcuts"
```

---

## Task 12: Export Completeness and Regression Tests

**Files:**
- Modify: `src/utils/exportSVG.ts`
- Modify: `src/utils/projectIO.test.ts`
- Modify: `src/utils/geometry.test.ts` (already complete)

**Interfaces:**
- Consumes: all `AnyObject` types and their renderers
- Produces: complete SVG export for all object types; JSON round-trip verified by tests

---

- [ ] **Step 1: Audit `src/utils/exportSVG.ts`**

Check that the export function iterates `layout.objects` (not just `FloorObject`). Verify it handles:
- `FloorObject` → existing `renderShape` path
- `WallSegment` → `<line>` with thickness
- `DimensionAnnotation` → `<line>` + `<text>` label
- `DoorObject` → simplified door symbol
- `WindowObject` → simplified window symbol

If any case is missing, add it now using the snippets from Tasks 7–9.

Also verify grid is NOT included in SVG export (existing canvas background export path).

- [ ] **Step 2: Add JSON round-trip tests**

In `src/utils/projectIO.test.ts`, add:

```ts
describe('JSON round-trip for all new object types', () => {
  function makeProjWith(obj: AnyObject) {
    const proj = makeDefaultProject()
    proj.layouts[0].objects.push(obj)
    return proj
  }

  test('WallSegment round-trip', () => {
    const wall: WallSegment = {
      type: 'wall', id: 'w1', name: 'W',
      start: { x: 0, y: 0 }, end: { x: 500, y: 0 }, thicknessMm: 100,
    }
    const loaded = loadProject(exportProject(makeProjWith(wall)))
    expect(loaded.layouts[0].objects.find(o => o.id === 'w1')).toMatchObject({
      type: 'wall', thicknessMm: 100,
    })
  })

  test('DoorObject round-trip', () => {
    const door: DoorObject = {
      type: 'door', id: 'd1', name: 'D', wallId: 'w1',
      offsetMm: 200, widthMm: 900, swingDirection: 'left', swingAngleDeg: 90,
    }
    const loaded = loadProject(exportProject(makeProjWith(door)))
    expect(loaded.layouts[0].objects.find(o => o.id === 'd1')).toMatchObject({
      type: 'door', widthMm: 900,
    })
  })

  test('WindowObject round-trip', () => {
    const win: WindowObject = {
      type: 'window', id: 'win1', name: 'W', wallId: 'w1',
      offsetMm: 100, widthMm: 1200,
    }
    const loaded = loadProject(exportProject(makeProjWith(win)))
    expect(loaded.layouts[0].objects.find(o => o.id === 'win1')).toMatchObject({
      type: 'window', widthMm: 1200,
    })
  })

  test('DimensionAnnotation round-trip', () => {
    const dim: DimensionAnnotation = {
      type: 'dimension', id: 'dim1',
      start: { x: 0, y: 0 }, end: { x: 1000, y: 0 },
    }
    const loaded = loadProject(exportProject(makeProjWith(dim)))
    expect(loaded.layouts[0].objects.find(o => o.id === 'dim1')).toMatchObject({
      type: 'dimension',
      end: { x: 1000, y: 0 },
    })
  })

  test('GridSettings round-trip', () => {
    const proj = makeDefaultProject()
    proj.layouts[0].canvas.grid.minorSpacingMm = 250
    const loaded = loadProject(exportProject(proj))
    expect(loaded.layouts[0].canvas.grid.minorSpacingMm).toBe(250)
  })
})
```

- [ ] **Step 3: Run all tests**

```bash
npm test
```

Expected: all tests pass (geometry: 13, shapes: 5, renderShape: 15, store: 20+, projectIO: 20+, PlacedObject: 4, PropertiesPanel: 5)

- [ ] **Step 4: Run build**

```bash
npm run build
```

Expected: no TypeScript errors, no warnings.

- [ ] **Step 5: Full manual regression**

Verify all existing Phase 1 features still work:
- App loads, background upload works, calibration works
- Pan/zoom works
- Layouts work (add/rename/delete/duplicate)
- Layers work (visibility/lock/reorder)
- Existing shapes render (rectangle, circle, etc.)
- Drag/resize/rotate works
- Undo/redo works
- LocalStorage persistence (reload page)
- JSON import/export works
- SVG export works

Verify new Phase 2 features:
- Grid visible, togglable, spacing changeable
- Snap works for shapes; Alt bypasses
- Dimension labels appear on selected shape
- Dimension tool creates annotations; survives reload; exports
- Wall tool: continuous draw, Shift for 45°, Esc to exit, endpoint editing
- Door tool: places on wall, draggable along wall
- Window tool: places on wall
- Properties panel shows correct fields for each type
- Delete key removes selected object (wall cascade removes attached doors/windows)

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat: phase 2 complete - grid, snap, dimensions, walls, doors, windows"
```

---

## Known Limitations (v2)

- Zoom anchors at SVG origin (0,0), not cursor position
- Door/window dragging along wall not yet implemented (offset editable via properties only)
- No snap-to-nearby-wall-endpoint (grid snap only)
- SVG export of doors uses simplified symbol (no arc)
- No boolean wall cutouts for doors/windows (visual overlay only)
- Grid not shown in SVG export
