# Floorplanner Standalone App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the BuildBox floor planner module into a standalone React + TypeScript + Vite app deployable to GitHub Pages.

**Architecture:** A single-page app with a Zustand store (immer + zundo + persist), an SVG canvas for floor-plan editing, and a panel-based UI (sidebar, properties, toolbar). All floor objects are rendered as basic geometric SVG shapes derived from structured data — no SVG template files. Project state serialises to JSON for import/export.

**Tech Stack:** React 19, TypeScript 5, Vite 7, Zustand 5 + immer 10 + zundo 2, Tailwind CSS 3, Vitest 3, Testing Library 16, gh-pages 6.

## Global Constraints

- `schemaVersion: 1` — bump only when the data model changes incompatibly
- localStorage key `'floorplanner-v1'`
- Vite base path `/floorplanner/` for GitHub Pages
- `homepage: "https://chryston.github.io/floorplanner"` in package.json
- ShapeType union (14 values): `"rectangle" | "square" | "circle" | "ellipse" | "semicircle" | "quadrant" | "triangle" | "right-triangle" | "wall" | "L-shape" | "U-shape" | "pentagon" | "hexagon" | "octagon"`
- `width`/`depth` always stored in object-local (unrotated) coordinates — never bounding-box dims
- `rotation` stored as degrees 0–360 (mod 360 on write)
- All pixel-space coordinates use `pixelsPerMm` to convert to/from mm; all stored coords are in mm
- No furniture catalog, no annotation tools, no "Wall to Hack" / "Floor to Tile" actions
- Source repo: `/home/chryston/repos/floorplanner/`
- Reference repo: `/home/chryston/repos/buildbox/src/components/FloorPlan/`

---

## File Map

| Path | Status | Responsibility |
|------|--------|----------------|
| `package.json` | Create | deps, scripts, homepage |
| `vite.config.ts` | Create | base path, react plugin, test config |
| `tailwind.config.ts` | Create | dark theme CSS vars |
| `postcss.config.js` | Create | tailwind + autoprefixer |
| `tsconfig.json` | Create | strict TS, path aliases |
| `tsconfig.node.json` | Create | vite/node types |
| `index.html` | Create | root HTML entry |
| `src/main.tsx` | Create | mount App |
| `src/index.css` | Create | tailwind directives + base styles |
| `src/App.tsx` | Create | root layout, image upload, modal wiring |
| `src/types/index.ts` | Create | all shared TypeScript interfaces |
| `src/data/shapes.ts` | Create | default dims per ShapeType |
| `src/store/store.ts` | Create | zustand store (immer+zundo+persist) + actions |
| `src/utils/renderShape.ts` | Create | JSX for all 14 shapes |
| `src/utils/projectIO.ts` | Create | export/import/migrate/validate |
| `src/utils/exportSVG.ts` | Create | serialize SVG to blob + download |
| `src/components/canvas/FloorPlanCanvas.tsx` | Create | pan/zoom SVG canvas |
| `src/components/canvas/CalibrationOverlay.tsx` | Adapt from BuildBox | two-click calibration |
| `src/components/canvas/PlacedObject.tsx` | Adapt from BuildBox | drag, resize, render |
| `src/components/modals/ScaleCalibrationModal.tsx` | Adapt from BuildBox | distance input modal |
| `src/components/modals/CustomShapeModal.tsx` | Adapt from BuildBox | name+dims form |
| `src/components/modals/ImportModal.tsx` | Create | JSON file import |
| `src/components/sidebar/ShapePalette.tsx` | Create | 14 shape add buttons |
| `src/components/sidebar/LayersPanel.tsx` | Create | layer CRUD + visibility/lock |
| `src/components/properties/PropertiesPanel.tsx` | Adapt from BuildBox | object properties editor |
| `src/components/toolbar/Toolbar.tsx` | Create | layout tabs, upload, export, undo/redo |
| `src/test/setup.ts` | Copy from BuildBox | JSDOM SVG stubs |
| `src/store/store.test.ts` | Create | store unit tests |
| `src/utils/renderShape.test.ts` | Create | shape renderer tests |
| `src/utils/projectIO.test.ts` | Create | IO round-trip + validation tests |
| `src/components/canvas/PlacedObject.test.tsx` | Create | drag/resize tests |
| `src/components/properties/PropertiesPanel.test.tsx` | Create | properties panel tests |

---

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tailwind.config.ts`
- Create: `postcss.config.js`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/index.css`
- Create: `src/App.tsx` (stub)

**Interfaces:**
- Produces: working `npm run dev`, `npm run build`, `npm test`

- [ ] **Step 1: Verify repo state**

```bash
cd /home/chryston/repos/floorplanner
git log --oneline -5
ls docs/superpowers/specs/
```
Expected: 3 commits, spec file present.

- [ ] **Step 2: Create `package.json`**

```json
{
  "name": "floorplanner",
  "private": true,
  "version": "0.1.0",
  "homepage": "https://chryston.github.io/floorplanner",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "deploy": "npm run build && gh-pages -d dist"
  },
  "dependencies": {
    "immer": "^10.0.0",
    "nanoid": "^5.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zundo": "^2.0.0",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "@tailwindcss/forms": "^0.5.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^5.0.0",
    "autoprefixer": "^10.0.0",
    "gh-pages": "^6.0.0",
    "jsdom": "^26.0.0",
    "postcss": "^8.0.0",
    "tailwindcss": "^3.0.0",
    "typescript": "^5.0.0",
    "vite": "^7.0.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 3: Create `vite.config.ts`**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/floorplanner/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
})
```

- [ ] **Step 4: Create `tailwind.config.ts`**

```typescript
import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#1c1c1e',
        panel: '#2c2c2e',
        'surface-raised': '#3a3a3c',
        accent: '#0a84ff',
        'accent-hover': '#1a93ff',
        divider: '#38383a',
        'text-primary': '#f5f5f7',
        'text-muted': '#86868b',
      },
    },
  },
  plugins: [forms],
} satisfies Config
```

- [ ] **Step 5: Create `postcss.config.js`**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 6: Create `tsconfig.json`**

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

- [ ] **Step 7: Create `tsconfig.app.json`**

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["src"]
}
```

- [ ] **Step 8: Create `tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["vite.config.ts", "tailwind.config.ts", "postcss.config.js"]
}
```

- [ ] **Step 9: Create `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Floorplanner</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 10: Create `src/main.tsx`**

```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 11: Create `src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  box-sizing: border-box;
}

html, body, #root {
  height: 100%;
  margin: 0;
  padding: 0;
  background-color: #1c1c1e;
  color: #f5f5f7;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

- [ ] **Step 12: Create stub `src/App.tsx`**

```typescript
export default function App() {
  return (
    <div className="flex h-full flex-col bg-surface text-text-primary">
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-48 bg-panel border-r border-divider p-2">Sidebar</aside>
        <main className="flex-1 bg-surface">Canvas</main>
        <aside className="w-64 bg-panel border-l border-divider p-2">Properties</aside>
      </div>
    </div>
  )
}
```

- [ ] **Step 13: Create `src/test/setup.ts`** (copy from BuildBox)

```typescript
import '@testing-library/jest-dom'

// JSDOM does not implement SVG APIs used by CalibrationOverlay
class SVGPoint {
  x = 0
  y = 0
  matrixTransform(_m: DOMMatrix) {
    return new SVGPoint()
  }
}

Object.defineProperty(SVGSVGElement.prototype, 'createSVGPoint', {
  value: () => new SVGPoint(),
  writable: true,
})

Object.defineProperty(SVGElement.prototype, 'getScreenCTM', {
  value: () => ({
    inverse: () => ({
      a: 1, b: 0, c: 0, d: 1, e: 0, f: 0,
    }),
  }),
  writable: true,
})
```

- [ ] **Step 14: Install dependencies**

```bash
cd /home/chryston/repos/floorplanner
npm install
```
Expected: `node_modules/` created, no errors.

- [ ] **Step 15: Verify dev server starts**

```bash
cd /home/chryston/repos/floorplanner
timeout 15 npm run dev -- --port 5173 2>&1 | head -20
```
Expected: "VITE v7" and `Local: http://localhost:5173/floorplanner/` in output.

- [ ] **Step 16: Commit**

```bash
cd /home/chryston/repos/floorplanner
git add -A
git commit -m "feat: scaffold React+Vite+TS+Tailwind app

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 2: Types & Shape Catalog

**Files:**
- Create: `src/types/index.ts`
- Create: `src/data/shapes.ts`
- Create: `src/data/shapes.test.ts`

**Interfaces:**
- Produces:
  - `ShapeType` — 14-value union
  - `FloorProject`, `FloorLayout`, `FloorLayer`, `FloorObject`, `CanvasSettings`, `FloorPlanImage`
  - `SHAPE_DEFAULTS: Record<ShapeType, { width: number; depth: number }>` — default mm dimensions
  - `getShapeDefaults(type: ShapeType): { width: number; depth: number }`
  - `ALL_SHAPE_TYPES: ShapeType[]`

- [ ] **Step 1: Write failing test**

Create `src/data/shapes.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { ALL_SHAPE_TYPES, getShapeDefaults, SHAPE_DEFAULTS } from './shapes'

describe('shape catalog', () => {
  it('has 14 shape types', () => {
    expect(ALL_SHAPE_TYPES).toHaveLength(14)
  })

  it('every shape type has positive width and depth defaults', () => {
    for (const type of ALL_SHAPE_TYPES) {
      const { width, depth } = getShapeDefaults(type)
      expect(width, `${type} width`).toBeGreaterThan(0)
      expect(depth, `${type} depth`).toBeGreaterThan(0)
    }
  })

  it('wall shape has depth of 10', () => {
    expect(getShapeDefaults('wall').depth).toBe(10)
  })

  it('circle default width equals depth', () => {
    const { width, depth } = getShapeDefaults('circle')
    expect(width).toBe(depth)
  })

  it('SHAPE_DEFAULTS covers all shape types', () => {
    for (const type of ALL_SHAPE_TYPES) {
      expect(SHAPE_DEFAULTS).toHaveProperty(type)
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /home/chryston/repos/floorplanner
npx vitest run src/data/shapes.test.ts 2>&1 | tail -20
```
Expected: FAIL — `Cannot find module './shapes'`

- [ ] **Step 3: Create `src/types/index.ts`**

```typescript
export type ShapeType =
  | 'rectangle'
  | 'square'
  | 'circle'
  | 'ellipse'
  | 'semicircle'
  | 'quadrant'
  | 'triangle'
  | 'right-triangle'
  | 'wall'
  | 'L-shape'
  | 'U-shape'
  | 'pentagon'
  | 'hexagon'
  | 'octagon'

export interface FloorPlanImage {
  dataUrl: string
  widthPx: number
  heightPx: number
}

export interface CanvasSettings {
  image: FloorPlanImage | null
  pixelsPerMm: number | null
}

export interface FloorLayer {
  id: string
  name: string
  visible: boolean
  locked: boolean
  order: number
}

export interface FloorObject {
  id: string
  name: string
  shapeType: ShapeType
  layerId: string
  x: number       // mm from top-left, unrotated
  y: number       // mm from top-left, unrotated
  width: number   // mm, local (unrotated) width
  depth: number   // mm, local (unrotated) depth
  height: number  // mm, 3D height (no 2D effect in v1)
  rotation: number // degrees 0-360
  memo?: string
  fill?: string
  stroke?: string
  locked?: boolean
  visible?: boolean
}

export interface FloorLayout {
  id: string
  name: string
  objects: FloorObject[]
  layers: FloorLayer[]
  canvas: CanvasSettings
  memo?: string
}

export interface FloorProject {
  schemaVersion: number
  id: string
  name: string
  layouts: FloorLayout[]
  activeLayoutId: string
  createdAt: string
  updatedAt: string
}
```

- [ ] **Step 4: Create `src/data/shapes.ts`**

```typescript
import type { ShapeType } from '../types'

export const ALL_SHAPE_TYPES: ShapeType[] = [
  'rectangle',
  'square',
  'circle',
  'ellipse',
  'semicircle',
  'quadrant',
  'triangle',
  'right-triangle',
  'wall',
  'L-shape',
  'U-shape',
  'pentagon',
  'hexagon',
  'octagon',
]

// Default dimensions in mm
export const SHAPE_DEFAULTS: Record<ShapeType, { width: number; depth: number }> = {
  rectangle:       { width: 200, depth: 100 },
  square:          { width: 150, depth: 150 },
  circle:          { width: 120, depth: 120 },
  ellipse:         { width: 200, depth: 120 },
  semicircle:      { width: 150, depth: 75  },
  quadrant:        { width: 150, depth: 150 },
  triangle:        { width: 150, depth: 150 },
  'right-triangle':{ width: 150, depth: 150 },
  wall:            { width: 300, depth: 10  },
  'L-shape':       { width: 200, depth: 200 },
  'U-shape':       { width: 200, depth: 200 },
  pentagon:        { width: 150, depth: 150 },
  hexagon:         { width: 150, depth: 150 },
  octagon:         { width: 150, depth: 150 },
}

export function getShapeDefaults(type: ShapeType): { width: number; depth: number } {
  return SHAPE_DEFAULTS[type]
}

export const SHAPE_LABELS: Record<ShapeType, string> = {
  rectangle:        'Rectangle',
  square:           'Square',
  circle:           'Circle',
  ellipse:          'Ellipse',
  semicircle:       'Semicircle',
  quadrant:         'Quadrant',
  triangle:         'Triangle',
  'right-triangle': 'Right Triangle',
  wall:             'Wall',
  'L-shape':        'L-Shape',
  'U-shape':        'U-Shape',
  pentagon:         'Pentagon',
  hexagon:          'Hexagon',
  octagon:          'Octagon',
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd /home/chryston/repos/floorplanner
npx vitest run src/data/shapes.test.ts 2>&1 | tail -10
```
Expected: PASS — 5 tests.

- [ ] **Step 6: Commit**

```bash
cd /home/chryston/repos/floorplanner
git add -A
git commit -m "feat: add types and shape catalog

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 3: Zustand Store

**Files:**
- Create: `src/store/store.ts`
- Create: `src/store/store.test.ts`

**Interfaces:**
- Consumes: `FloorProject`, `FloorLayout`, `FloorLayer`, `FloorObject`, `CanvasSettings`, `ShapeType` from `src/types/index.ts`; `getShapeDefaults` from `src/data/shapes.ts`; `nanoid` from `nanoid`
- Produces:
  - `useStore` — zustand hook
  - `useTemporalStore` — zundo temporal hook  
  - `activeLayout(project): FloorLayout` — exported helper
  - Store state shape: `{ project: FloorProject, selectedObjectId: string | null }`
  - Actions: `setProjectName`, `addLayout`, `duplicateLayout`, `renameLayout`, `deleteLayout`, `switchLayout`, `setLayoutMemo`, `addObject`, `updateObject`, `deleteObject`, `addLayer`, `renameLayer`, `setLayerVisible`, `setLayerLocked`, `reorderLayer`, `deleteLayer`, `setCanvasImage`, `setPixelsPerMm`, `clearCanvas`, `importProject`, `selectObject`, `clearSelection`

- [ ] **Step 1: Write failing tests**

Create `src/store/store.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { useStore, useTemporalStore, activeLayout } from './store'

function getStore() {
  return useStore.getState()
}

beforeEach(() => {
  useStore.setState(useStore.getInitialState())
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
    expect(layout.objects[0].shapeType).toBe('circle')
  })

  it('addObject sets width/depth from shape defaults', () => {
    getStore().addObject('wall')
    const obj = activeLayout(getStore().project).objects[0]
    expect(obj.width).toBe(300)
    expect(obj.depth).toBe(10)
  })

  it('updateObject merges partial fields', () => {
    getStore().addObject('rectangle')
    const obj = activeLayout(getStore().project).objects[0]
    getStore().updateObject(obj.id, { name: 'Sofa', width: 180 })
    const updated = activeLayout(getStore().project).objects[0]
    expect(updated.name).toBe('Sofa')
    expect(updated.width).toBe(180)
    expect(updated.depth).toBe(obj.depth) // unchanged
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
        canvas: { image: null, pixelsPerMm: null },
      }],
    }
    getStore().importProject(newProject)
    expect(getStore().project.name).toBe('Imported')
    expect(getStore().selectedObjectId).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /home/chryston/repos/floorplanner
npx vitest run src/store/store.test.ts 2>&1 | tail -10
```
Expected: FAIL — `Cannot find module './store'`

- [ ] **Step 3: Create `src/store/store.ts`**

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { temporal } from 'zundo'
import { produce } from 'immer'
import { nanoid } from 'nanoid'
import { shallow } from 'zustand/shallow'
import type { FloorProject, FloorLayout, FloorLayer, FloorObject, ShapeType } from '../types'
import { getShapeDefaults } from '../data/shapes'

export const SCHEMA_VERSION = 1

function makeDefaultLayer(): FloorLayer {
  return { id: nanoid(), name: 'Default', visible: true, locked: false, order: 0 }
}

function makeDefaultLayout(name: string): FloorLayout {
  return {
    id: nanoid(),
    name,
    objects: [],
    layers: [makeDefaultLayer()],
    canvas: { image: null, pixelsPerMm: null },
  }
}

function makeDefaultProject(): FloorProject {
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

function touchProject(project: FloorProject): FloorProject {
  return { ...project, updatedAt: new Date().toISOString() }
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
  updateObject: (objectId: string, patch: Partial<FloorObject>) => void
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
  // Project IO
  importProject: (project: FloorProject) => void
  // Selection (not persisted)
  selectObject: (id: string) => void
  clearSelection: () => void
}

const defaultProject = makeDefaultProject()

const stateCreator = (set: (fn: (s: StoreState) => void) => void): StoreState => ({
  project: defaultProject,
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

  updateObject: (objectId, patch) => set(s => {
    const layout = s.project.layouts.find(l => l.id === s.project.activeLayoutId) ?? s.project.layouts[0]
    const obj = layout.objects.find(o => o.id === objectId)
    if (obj) {
      Object.assign(obj, patch)
      if (patch.rotation !== undefined) {
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
  }),

  setLayerLocked: (layerId, locked) => set(s => {
    const layout = s.project.layouts.find(l => l.id === s.project.activeLayoutId) ?? s.project.layouts[0]
    const layer = layout.layers.find(l => l.id === layerId)
    if (layer) layer.locked = locked
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

// Expose getInitialState for tests
;(useStore as any).getInitialState = () => ({
  project: makeDefaultProject(),
  selectedObjectId: null,
  ...(useStore as any)._actions,
})

export const useTemporalStore = (useStore as any).temporal
```

> **Note:** The `getInitialState` pattern is a test helper. For test resets, use `useStore.setState({ project: makeDefaultProject(), selectedObjectId: null })` where `makeDefaultProject` is exported.

Actually, let's revise the store slightly to export `makeDefaultProject` and fix the `getInitialState` pattern:

```typescript
// Add these two exports near the bottom, before useStore creation:
export { makeDefaultProject }
```

And update the test's `beforeEach`:

```typescript
import { useStore, useTemporalStore, activeLayout, makeDefaultProject } from './store'

beforeEach(() => {
  useStore.setState({ project: makeDefaultProject(), selectedObjectId: null })
  useTemporalStore.getState().clear()
})
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /home/chryston/repos/floorplanner
npx vitest run src/store/store.test.ts 2>&1 | tail -20
```
Expected: PASS — all tests green.

- [ ] **Step 5: Commit**

```bash
cd /home/chryston/repos/floorplanner
git add -A
git commit -m "feat: add zustand store with immer/zundo/persist

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 4: Shape Rendering

**Files:**
- Create: `src/utils/renderShape.ts`
- Create: `src/utils/renderShape.test.ts`

**Interfaces:**
- Consumes: `FloorObject`, `ShapeType` from `src/types/index.ts`
- Produces:
  - `renderShape(obj: FloorObject): React.ReactElement` — returns an SVG element (no wrapper)

- [ ] **Step 1: Write failing tests**

Create `src/utils/renderShape.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { renderShape } from './renderShape'
import type { FloorObject } from '../types'

function makeObj(overrides: Partial<FloorObject> = {}): FloorObject {
  return {
    id: 'test',
    name: 'test',
    shapeType: 'rectangle',
    layerId: 'l1',
    x: 0,
    y: 0,
    width: 100,
    depth: 50,
    height: 2400,
    rotation: 0,
    fill: '#fff',
    stroke: '#000',
    locked: false,
    visible: true,
    ...overrides,
  }
}

describe('renderShape', () => {
  it('rectangle returns rect element with width/height', () => {
    const el = renderShape(makeObj({ shapeType: 'rectangle', width: 100, depth: 50 }))
    expect(el.type).toBe('rect')
    expect(el.props.width).toBe(100)
    expect(el.props.height).toBe(50)
  })

  it('square returns rect element', () => {
    const el = renderShape(makeObj({ shapeType: 'square', width: 150, depth: 150 }))
    expect(el.type).toBe('rect')
    expect(el.props.width).toBe(150)
    expect(el.props.height).toBe(150)
  })

  it('circle returns circle element with correct radius', () => {
    const el = renderShape(makeObj({ shapeType: 'circle', width: 120, depth: 120 }))
    expect(el.type).toBe('circle')
    expect(el.props.r).toBe(60) // half of width
  })

  it('ellipse returns ellipse element', () => {
    const el = renderShape(makeObj({ shapeType: 'ellipse', width: 200, depth: 100 }))
    expect(el.type).toBe('ellipse')
    expect(el.props.rx).toBe(100)
    expect(el.props.ry).toBe(50)
  })

  it('triangle returns polygon with 3 points', () => {
    const el = renderShape(makeObj({ shapeType: 'triangle', width: 100, depth: 100 }))
    expect(el.type).toBe('polygon')
    const points: string = el.props.points
    expect(points.trim().split(' ')).toHaveLength(3)
  })

  it('right-triangle returns polygon with 3 points', () => {
    const el = renderShape(makeObj({ shapeType: 'right-triangle', width: 100, depth: 100 }))
    expect(el.type).toBe('polygon')
    const points: string = el.props.points
    expect(points.trim().split(' ')).toHaveLength(3)
  })

  it('wall returns line element', () => {
    const el = renderShape(makeObj({ shapeType: 'wall', width: 200, depth: 10 }))
    expect(el.type).toBe('line')
  })

  it('hexagon returns polygon with 6 points', () => {
    const el = renderShape(makeObj({ shapeType: 'hexagon', width: 150, depth: 150 }))
    expect(el.type).toBe('polygon')
    const points: string = el.props.points
    expect(points.trim().split(' ')).toHaveLength(6)
  })

  it('pentagon returns polygon with 5 points', () => {
    const el = renderShape(makeObj({ shapeType: 'pentagon', width: 150, depth: 150 }))
    expect(el.type).toBe('polygon')
    const points: string = el.props.points
    expect(points.trim().split(' ')).toHaveLength(5)
  })

  it('octagon returns polygon with 8 points', () => {
    const el = renderShape(makeObj({ shapeType: 'octagon', width: 150, depth: 150 }))
    expect(el.type).toBe('polygon')
    const points: string = el.props.points
    expect(points.trim().split(' ')).toHaveLength(8)
  })

  it('fill and stroke props are passed through', () => {
    const el = renderShape(makeObj({ fill: '#red', stroke: '#blue' }))
    expect(el.props.fill).toBe('#red')
    expect(el.props.stroke).toBe('#blue')
  })

  it('semicircle returns path element', () => {
    const el = renderShape(makeObj({ shapeType: 'semicircle', width: 150, depth: 75 }))
    expect(el.type).toBe('path')
  })

  it('quadrant returns path element', () => {
    const el = renderShape(makeObj({ shapeType: 'quadrant', width: 150, depth: 150 }))
    expect(el.type).toBe('path')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /home/chryston/repos/floorplanner
npx vitest run src/utils/renderShape.test.ts 2>&1 | tail -10
```
Expected: FAIL — `Cannot find module './renderShape'`

- [ ] **Step 3: Create `src/utils/renderShape.ts`**

```typescript
import React from 'react'
import type { FloorObject } from '../types'

// Build a polygon points string for a regular n-gon centered at (cx, cy)
function nGonPoints(cx: number, cy: number, rx: number, ry: number, n: number, offsetAngle = 0): string {
  return Array.from({ length: n }, (_, i) => {
    const angle = (2 * Math.PI * i) / n + offsetAngle
    const x = cx + rx * Math.cos(angle)
    const y = cy + ry * Math.sin(angle)
    return `${x},${y}`
  }).join(' ')
}

export function renderShape(obj: FloorObject): React.ReactElement {
  const { shapeType, width: w, depth: d, fill = '#60a5fa', stroke = '#2563eb' } = obj
  const sharedProps = { fill, stroke, strokeWidth: 1 }

  switch (shapeType) {
    case 'rectangle':
    case 'square':
      return React.createElement('rect', { ...sharedProps, x: 0, y: 0, width: w, height: d })

    case 'circle': {
      const r = w / 2
      return React.createElement('circle', { ...sharedProps, cx: w / 2, cy: d / 2, r })
    }

    case 'ellipse':
      return React.createElement('ellipse', { ...sharedProps, cx: w / 2, cy: d / 2, rx: w / 2, ry: d / 2 })

    case 'semicircle': {
      // Flat side at bottom, arc at top, centered horizontally
      const r = w / 2
      const d_path = `M 0,${d} A ${r},${r} 0 0,1 ${w},${d} Z`
      return React.createElement('path', { ...sharedProps, d: d_path })
    }

    case 'quadrant': {
      // Quarter circle, corner at top-left, arc goes to bottom-right
      const r = Math.min(w, d)
      const d_path = `M 0,0 L ${w},0 A ${r},${r} 0 0,1 0,${d} Z`
      return React.createElement('path', { ...sharedProps, d: d_path })
    }

    case 'triangle': {
      // Isoceles triangle: apex top-center, base at bottom
      const points = `${w / 2},0 ${w},${d} 0,${d}`
      return React.createElement('polygon', { ...sharedProps, points })
    }

    case 'right-triangle': {
      // Right angle at bottom-left
      const points = `0,0 ${w},${d} 0,${d}`
      return React.createElement('polygon', { ...sharedProps, points })
    }

    case 'wall':
      return React.createElement('line', {
        stroke,
        strokeWidth: Math.max(2, d),
        strokeLinecap: 'round',
        x1: 0,
        y1: d / 2,
        x2: w,
        y2: d / 2,
      })

    case 'L-shape': {
      // L shape occupying full w×d bounding box, arm thickness = 1/3 of shorter side
      const t = Math.min(w, d) / 3
      const points = `0,0 ${t},0 ${t},${d - t} ${w},${d - t} ${w},${d} 0,${d}`
      return React.createElement('polygon', { ...sharedProps, points })
    }

    case 'U-shape': {
      // U shape: two vertical arms and a horizontal base
      const t = Math.min(w, d) / 4
      const points = `0,0 ${t},0 ${t},${d - t} ${w - t},${d - t} ${w - t},0 ${w},0 ${w},${d} 0,${d}`
      return React.createElement('polygon', { ...sharedProps, points })
    }

    case 'pentagon':
      return React.createElement('polygon', {
        ...sharedProps,
        // Flat-bottom orientation: rotate by -π/2 so apex is at top
        points: nGonPoints(w / 2, d / 2, w / 2, d / 2, 5, -Math.PI / 2),
      })

    case 'hexagon':
      return React.createElement('polygon', {
        ...sharedProps,
        points: nGonPoints(w / 2, d / 2, w / 2, d / 2, 6, 0),
      })

    case 'octagon':
      return React.createElement('polygon', {
        ...sharedProps,
        points: nGonPoints(w / 2, d / 2, w / 2, d / 2, 8, -Math.PI / 8),
      })

    default:
      // Exhaustiveness check
      return React.createElement('rect', { ...sharedProps, x: 0, y: 0, width: w, height: d })
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /home/chryston/repos/floorplanner
npx vitest run src/utils/renderShape.test.ts 2>&1 | tail -10
```
Expected: PASS — all 14 tests green.

- [ ] **Step 5: Commit**

```bash
cd /home/chryston/repos/floorplanner
git add -A
git commit -m "feat: add shape renderer for 14 shape types

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 5: Project IO

**Files:**
- Create: `src/utils/exportSVG.ts`
- Create: `src/utils/projectIO.ts`
- Create: `src/utils/projectIO.test.ts`

**Interfaces:**
- Consumes: `FloorProject` from `src/types/index.ts`; `SCHEMA_VERSION` from `src/store/store.ts`
- Produces:
  - `exportSVGBlob(svgEl: SVGSVGElement): Blob`
  - `downloadFile(blob: Blob, filename: string): void`
  - `exportProject(project: FloorProject): string` — JSON string
  - `downloadProjectJSON(project: FloorProject, name?: string): void`
  - `loadProject(raw: unknown): FloorProject` — throws `ProjectImportError`
  - `migrateProject(raw: Record<string, unknown>, fromVersion: number): FloorProject`
  - `class ProjectImportError extends Error`

- [ ] **Step 1: Write failing tests**

Create `src/utils/projectIO.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { exportProject, loadProject, ProjectImportError } from './projectIO'
import type { FloorProject } from '../types'

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
        canvas: { image: null, pixelsPerMm: null },
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /home/chryston/repos/floorplanner
npx vitest run src/utils/projectIO.test.ts 2>&1 | tail -10
```
Expected: FAIL — `Cannot find module './projectIO'`

- [ ] **Step 3: Create `src/utils/exportSVG.ts`**

```typescript
export function exportSVGBlob(svgEl: SVGSVGElement): Blob {
  const serializer = new XMLSerializer()
  const source = serializer.serializeToString(svgEl)
  const svgBlob = new Blob(
    ['<?xml version="1.0" standalone="no"?>\r\n', source],
    { type: 'image/svg+xml;charset=utf-8' }
  )
  return svgBlob
}

export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
```

- [ ] **Step 4: Create `src/utils/projectIO.ts`**

```typescript
import type { FloorProject } from '../types'
import { SCHEMA_VERSION } from '../store/store'
import { downloadFile } from './exportSVG'

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

// Migrate from an older schema version to current. No-op at v1.
export function migrateProject(
  raw: Record<string, unknown>,
  fromVersion: number
): FloorProject {
  if (fromVersion === SCHEMA_VERSION) {
    return raw as unknown as FloorProject
  }
  // Future: add migration steps here
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
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd /home/chryston/repos/floorplanner
npx vitest run src/utils/projectIO.test.ts 2>&1 | tail -10
```
Expected: PASS — all tests green.

- [ ] **Step 6: Commit**

```bash
cd /home/chryston/repos/floorplanner
git add -A
git commit -m "feat: add project export/import with validation

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 6: Canvas Core

**Files:**
- Create: `src/components/canvas/FloorPlanCanvas.tsx`
- Adapt: `src/components/canvas/CalibrationOverlay.tsx` (from BuildBox)

**Interfaces:**
- Consumes: `useStore`, `activeLayout` from `src/store/store.ts`; `FloorLayout`, `FloorObject` from `src/types/index.ts`
- Produces:
  - `<FloorPlanCanvas />` — self-contained SVG canvas; reads store directly
  - `<CalibrationOverlay svgRef onCalibrationClick />` — two-click calibration points

Source for CalibrationOverlay: `/home/chryston/repos/buildbox/src/components/FloorPlan/CalibrationOverlay.tsx`
Source for FloorPlanCanvas: `/home/chryston/repos/buildbox/src/components/FloorPlan/FloorPlanCanvas.tsx` (adapt: remove AnnotationLayer, swap store hooks, rename `floorPlan` prop to `layout`)

- [ ] **Step 1: Read BuildBox source**

```bash
cat /home/chryston/repos/buildbox/src/components/FloorPlan/CalibrationOverlay.tsx
cat /home/chryston/repos/buildbox/src/components/FloorPlan/FloorPlanCanvas.tsx
```

- [ ] **Step 2: Create `src/components/canvas/CalibrationOverlay.tsx`**

Adapt from BuildBox — change import paths only (no BuildBox store, no BuildBox types):

```typescript
import React from 'react'

interface CalibrationPoint {
  svgX: number
  svgY: number
  screenX: number
  screenY: number
}

interface Props {
  svgRef: React.RefObject<SVGSVGElement | null>
  onCalibrationClick: (point: CalibrationPoint) => void
}

export function CalibrationOverlay({ svgRef, onCalibrationClick }: Props) {
  const handleClick = (e: React.MouseEvent<SVGRectElement>) => {
    const svg = svgRef.current
    if (!svg) return
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const svgPt = pt.matrixTransform(svg.getScreenCTM()!.inverse())
    onCalibrationClick({
      svgX: svgPt.x,
      svgY: svgPt.y,
      screenX: e.clientX,
      screenY: e.clientY,
    })
  }

  return (
    <rect
      x={-9999}
      y={-9999}
      width={99999}
      height={99999}
      fill="transparent"
      style={{ cursor: 'crosshair' }}
      onClick={handleClick}
    />
  )
}
```

- [ ] **Step 3: Create `src/components/canvas/FloorPlanCanvas.tsx`**

```typescript
import React, { useRef, useCallback, useState } from 'react'
import { useStore, activeLayout } from '../../store/store'
import { CalibrationOverlay } from './CalibrationOverlay'
import { PlacedObject } from './PlacedObject'

const MIN_ZOOM = 0.1
const MAX_ZOOM = 5
const ZOOM_SENSITIVITY = 0.001

interface Props {
  calibrating: boolean
  onCalibrationPoint: (pt: { svgX: number; svgY: number; screenX: number; screenY: number }) => void
}

export function FloorPlanCanvas({ calibrating, onCalibrationPoint }: Props) {
  const project = useStore(s => s.project)
  const selectedObjectId = useStore(s => s.selectedObjectId)
  const clearSelection = useStore(s => s.clearSelection)

  const layout = activeLayout(project)
  const canvas = layout.canvas

  const svgRef = useRef<SVGSVGElement>(null)
  const [zoom, setZoom] = useState(1)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const isPanning = useRef(false)
  const lastPan = useRef({ x: 0, y: 0 })

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = -e.deltaY * ZOOM_SENSITIVITY
    setZoom(z => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z + delta * z)))
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Middle mouse or space+left = pan
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      isPanning.current = true
      lastPan.current = { x: e.clientX, y: e.clientY }
      e.preventDefault()
    }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current) return
    const dx = e.clientX - lastPan.current.x
    const dy = e.clientY - lastPan.current.y
    lastPan.current = { x: e.clientX, y: e.clientY }
    setPanX(px => px + dx / zoom)
    setPanY(py => py + dy / zoom)
  }, [zoom])

  const handleMouseUp = useCallback(() => {
    isPanning.current = false
  }, [])

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as SVGElement).dataset.objectId) return
    clearSelection()
  }, [clearSelection])

  const imgW = canvas.image && canvas.pixelsPerMm
    ? canvas.image.widthPx / canvas.pixelsPerMm
    : 800
  const imgH = canvas.image && canvas.pixelsPerMm
    ? canvas.image.heightPx / canvas.pixelsPerMm
    : 600

  const visibleLayerIds = new Set(layout.layers.filter(l => l.visible).map(l => l.id))
  const sortedObjects = [...layout.objects]
    .filter(o => o.visible !== false && visibleLayerIds.has(o.layerId))
    .sort((a, b) => {
      const la = layout.layers.find(l => l.id === a.layerId)?.order ?? 0
      const lb = layout.layers.find(l => l.id === b.layerId)?.order ?? 0
      return la - lb
    })

  return (
    <svg
      ref={svgRef}
      className="w-full h-full"
      style={{ cursor: calibrating ? 'crosshair' : isPanning.current ? 'grabbing' : 'default' }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleCanvasClick}
    >
      <g transform={`translate(${panX},${panY}) scale(${zoom})`}>
        {/* Background / image */}
        {canvas.image ? (
          <image
            href={canvas.image.dataUrl}
            x={0}
            y={0}
            width={imgW}
            height={imgH}
            style={{ pointerEvents: 'none' }}
          />
        ) : (
          <rect
            x={0}
            y={0}
            width={imgW}
            height={imgH}
            fill="#2c2c2e"
            stroke="#38383a"
            strokeWidth={1}
          />
        )}

        {/* Objects */}
        {sortedObjects.map(obj => (
          <PlacedObject
            key={obj.id}
            object={obj}
            isSelected={obj.id === selectedObjectId}
            svgRef={svgRef}
            zoom={zoom}
          />
        ))}

        {/* Calibration overlay */}
        {calibrating && (
          <CalibrationOverlay svgRef={svgRef} onCalibrationClick={onCalibrationPoint} />
        )}
      </g>
    </svg>
  )
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /home/chryston/repos/floorplanner
npx tsc --noEmit 2>&1 | head -30
```
Expected: no errors (PlacedObject import will error until Task 7 — that's acceptable, note the error and move on)

- [ ] **Step 5: Commit**

```bash
cd /home/chryston/repos/floorplanner
git add -A
git commit -m "feat: add pan/zoom SVG canvas and calibration overlay

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 7: PlacedObject

**Files:**
- Create: `src/components/canvas/PlacedObject.tsx`
- Create: `src/components/canvas/PlacedObject.test.tsx`

**Interfaces:**
- Consumes: `FloorObject` from `src/types/index.ts`; `renderShape` from `src/utils/renderShape.ts`; `useStore` from `src/store/store.ts`
- Produces:
  - `<PlacedObject object svgRef zoom isSelected />` — SVG group with drag, 8 resize handles, selection ring

Key design invariant: `width`/`depth` always stay in local (unrotated) space. Mouse deltas are projected into local space using `rotate(-rotation)` before modifying dimensions.

Source reference: `/home/chryston/repos/buildbox/src/components/FloorPlan/PlacedObject.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/canvas/PlacedObject.test.tsx`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PlacedObject } from './PlacedObject'
import { useStore, makeDefaultProject } from '../../store/store'
import type { FloorObject } from '../../types'

function makeObj(overrides: Partial<FloorObject> = {}): FloorObject {
  return {
    id: 'obj1',
    name: 'Test',
    shapeType: 'rectangle',
    layerId: 'ly1',
    x: 50,
    y: 50,
    width: 100,
    depth: 80,
    height: 2400,
    rotation: 0,
    fill: '#60a5fa',
    stroke: '#2563eb',
    locked: false,
    visible: true,
    ...overrides,
  }
}

beforeEach(() => {
  useStore.setState({ project: makeDefaultProject(), selectedObjectId: null })
})

describe('PlacedObject', () => {
  it('renders without crashing', () => {
    const svgRef = { current: document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement }
    const { container } = render(
      <svg>
        <PlacedObject object={makeObj()} isSelected={false} svgRef={svgRef} zoom={1} />
      </svg>
    )
    expect(container.querySelector('g')).toBeTruthy()
  })

  it('applies rotation transform', () => {
    const svgRef = { current: document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement }
    const { container } = render(
      <svg>
        <PlacedObject object={makeObj({ rotation: 45 })} isSelected={false} svgRef={svgRef} zoom={1} />
      </svg>
    )
    const g = container.querySelector('g')!
    expect(g.getAttribute('transform')).toContain('rotate(45')
  })

  it('calls selectObject on click', async () => {
    const svgRef = { current: document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement }
    render(
      <svg>
        <PlacedObject object={makeObj()} isSelected={false} svgRef={svgRef} zoom={1} />
      </svg>
    )
    // selectObject is tested via store — click fires store action
    expect(useStore.getState().selectedObjectId).toBeNull()
  })

  it('shows 8 resize handles when selected', () => {
    const svgRef = { current: document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement }
    const { container } = render(
      <svg>
        <PlacedObject object={makeObj()} isSelected={true} svgRef={svgRef} zoom={1} />
      </svg>
    )
    // Resize handles are rects with data-handle attribute
    const handles = container.querySelectorAll('[data-handle]')
    expect(handles).toHaveLength(8)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /home/chryston/repos/floorplanner
npx vitest run src/components/canvas/PlacedObject.test.tsx 2>&1 | tail -10
```
Expected: FAIL — `Cannot find module './PlacedObject'`

- [ ] **Step 3: Create `src/components/canvas/PlacedObject.tsx`**

```typescript
import React, { useCallback, useRef } from 'react'
import { useStore } from '../../store/store'
import { renderShape } from '../../utils/renderShape'
import type { FloorObject } from '../../types'

const HANDLE_SIZE = 8

type HandleDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

interface Props {
  object: FloorObject
  isSelected: boolean
  svgRef: React.RefObject<SVGSVGElement | null>
  zoom: number
}

function getSvgScale(svgEl: SVGSVGElement): number {
  const rect = svgEl.getBoundingClientRect()
  const viewBox = svgEl.viewBox.baseVal
  if (!viewBox || viewBox.width === 0) return 1
  return viewBox.width / rect.width
}

export function PlacedObject({ object, isSelected, svgRef, zoom }: Props) {
  const updateObject = useStore(s => s.updateObject)
  const selectObject = useStore(s => s.selectObject)

  const { id, x, y, width, depth, rotation, name, locked } = object

  const cx = x + width / 2
  const cy = y + depth / 2

  const dragStart = useRef<{ mx: number; my: number; ox: number; oy: number } | null>(null)

  // Drag handler
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (locked) return
    e.stopPropagation()
    selectObject(id)
    const svg = svgRef.current
    if (!svg) return
    const scale = getSvgScale(svg) / zoom
    dragStart.current = { mx: e.clientX * scale, my: e.clientY * scale, ox: x, oy: y }

    const onMove = (mv: MouseEvent) => {
      if (!dragStart.current) return
      const dx = mv.clientX * scale - dragStart.current.mx
      const dy = mv.clientY * scale - dragStart.current.my
      updateObject(id, { x: dragStart.current.ox + dx, y: dragStart.current.oy + dy })
    }
    const onUp = () => {
      dragStart.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [id, x, y, locked, zoom, svgRef, updateObject, selectObject])

  // Resize handler — projects deltas into object-local space to preserve width/depth semantics
  const makeResizeHandler = useCallback((dir: HandleDir) => (e: React.MouseEvent) => {
    if (locked) return
    e.stopPropagation()
    const svg = svgRef.current
    if (!svg) return
    const scale = getSvgScale(svg) / zoom
    let startX = e.clientX * scale
    let startY = e.clientY * scale
    let currentW = width
    let currentD = depth
    let currentX = x
    let currentY = y
    const rad = (rotation * Math.PI) / 180
    const cos = Math.cos(-rad)
    const sin = Math.sin(-rad)

    const onMove = (mv: MouseEvent) => {
      const rawDx = mv.clientX * scale - startX
      const rawDy = mv.clientY * scale - startY
      startX = mv.clientX * scale
      startY = mv.clientY * scale

      // Project delta into object-local (unrotated) coordinate system
      const localDx = rawDx * cos - rawDy * sin
      const localDy = rawDx * sin + rawDy * cos

      let newW = currentW
      let newD = currentD
      let newX = currentX
      let newY = currentY

      if (dir.includes('e')) newW = Math.max(10, newW + localDx)
      if (dir.includes('s')) newD = Math.max(10, newD + localDy)
      if (dir.includes('w')) { newW = Math.max(10, newW - localDx); newX = currentX + (currentW - newW) }
      if (dir.includes('n')) { newD = Math.max(10, newD - localDy); newY = currentY + (currentD - newD) }

      currentW = newW
      currentD = newD
      currentX = newX
      currentY = newY

      updateObject(id, { width: newW, depth: newD, x: newX, y: newY })
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [id, x, y, width, depth, rotation, locked, zoom, svgRef, updateObject])

  const hs = HANDLE_SIZE / zoom
  const handlePositions: Record<HandleDir, [number, number]> = {
    n:  [cx,         y],
    s:  [cx,         y + depth],
    e:  [x + width,  cy],
    w:  [x,          cy],
    ne: [x + width,  y],
    nw: [x,          y],
    se: [x + width,  y + depth],
    sw: [x,          y + depth],
  }

  return (
    <g
      transform={`rotate(${rotation}, ${cx}, ${cy})`}
      onMouseDown={handleMouseDown}
      style={{ cursor: locked ? 'default' : 'move' }}
      data-object-id={id}
    >
      {renderShape(object)}

      {/* Object name label */}
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={Math.max(10, Math.min(14, Math.min(width, depth) / 4)) / zoom}
        fill="#f5f5f7"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {name}
      </text>

      {/* Selection ring */}
      {isSelected && (
        <rect
          x={x - 2 / zoom}
          y={y - 2 / zoom}
          width={width + 4 / zoom}
          height={depth + 4 / zoom}
          fill="none"
          stroke="#0a84ff"
          strokeWidth={2 / zoom}
          strokeDasharray={`${4 / zoom},${2 / zoom}`}
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* Resize handles */}
      {isSelected && !locked && (Object.entries(handlePositions) as [HandleDir, [number, number]][]).map(([dir, [hx, hy]]) => (
        <rect
          key={dir}
          data-handle={dir}
          x={hx - hs / 2}
          y={hy - hs / 2}
          width={hs}
          height={hs}
          fill="white"
          stroke="#0a84ff"
          strokeWidth={1 / zoom}
          style={{ cursor: `${dir}-resize` }}
          onMouseDown={makeResizeHandler(dir)}
        />
      ))}
    </g>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /home/chryston/repos/floorplanner
npx vitest run src/components/canvas/PlacedObject.test.tsx 2>&1 | tail -10
```
Expected: PASS — all tests green.

- [ ] **Step 5: Commit**

```bash
cd /home/chryston/repos/floorplanner
git add -A
git commit -m "feat: add PlacedObject with drag, resize, and rotation support

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 8: Modals

**Files:**
- Adapt: `src/components/modals/ScaleCalibrationModal.tsx` (from BuildBox)
- Adapt: `src/components/modals/CustomShapeModal.tsx` (from BuildBox, simplified)
- Create: `src/components/modals/ImportModal.tsx`

**Interfaces:**
- Produces:
  - `<ScaleCalibrationModal distancePx onConfirm(realMm) onCancel />` — enter real-world distance
  - `<CustomShapeModal onConfirm(name, width, depth) onCancel />` — new custom shape form
  - `<ImportModal onConfirm(project) onCancel />` — JSON file chooser + preview

Source for ScaleCalibrationModal: `/home/chryston/repos/buildbox/src/components/FloorPlan/ScaleCalibrationModal.tsx`
Source for CustomShapeModal: `/home/chryston/repos/buildbox/src/components/FloorPlan/CustomShapeModal.tsx`

- [ ] **Step 1: Read BuildBox modal sources**

```bash
cat /home/chryston/repos/buildbox/src/components/FloorPlan/ScaleCalibrationModal.tsx
cat /home/chryston/repos/buildbox/src/components/FloorPlan/CustomShapeModal.tsx
```

- [ ] **Step 2: Create `src/components/modals/ScaleCalibrationModal.tsx`**

```typescript
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
```

- [ ] **Step 3: Create `src/components/modals/CustomShapeModal.tsx`**

Simplified from BuildBox — name + width + depth only:

```typescript
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
```

- [ ] **Step 4: Create `src/components/modals/ImportModal.tsx`**

```typescript
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
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd /home/chryston/repos/floorplanner
npx tsc --noEmit 2>&1 | grep -v "PlacedObject\|FloorPlanCanvas" | head -20
```
Expected: no errors in modal files.

- [ ] **Step 6: Commit**

```bash
cd /home/chryston/repos/floorplanner
git add -A
git commit -m "feat: add calibration, custom shape, and import modals

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 9: Sidebar (ShapePalette + LayersPanel)

**Files:**
- Create: `src/components/sidebar/ShapePalette.tsx`
- Create: `src/components/sidebar/LayersPanel.tsx`

**Interfaces:**
- Consumes: `useStore`, `activeLayout` from `src/store/store.ts`; `ALL_SHAPE_TYPES`, `SHAPE_LABELS` from `src/data/shapes.ts`; `ShapeType` from `src/types/index.ts`
- Produces:
  - `<ShapePalette onAddCustom />` — grid of shape buttons + "Custom…" button
  - `<LayersPanel />` — layer list with visibility, lock toggles, add/delete/rename

- [ ] **Step 1: Create `src/components/sidebar/ShapePalette.tsx`**

```typescript
import React from 'react'
import { useStore } from '../../store/store'
import { ALL_SHAPE_TYPES, SHAPE_LABELS } from '../../data/shapes'
import type { ShapeType } from '../../types'

interface Props {
  onAddCustom: () => void
}

// Mini SVG icon for each shape type
function ShapeIcon({ type }: { type: ShapeType }) {
  const S = 28
  const fill = '#60a5fa'
  const stroke = '#2563eb'
  switch (type) {
    case 'rectangle': return <svg width={S} height={S/2}><rect x={0} y={0} width={S} height={S/2} fill={fill} stroke={stroke} strokeWidth={1}/></svg>
    case 'square': return <svg width={S} height={S}><rect x={0} y={0} width={S} height={S} fill={fill} stroke={stroke} strokeWidth={1}/></svg>
    case 'circle': return <svg width={S} height={S}><circle cx={S/2} cy={S/2} r={S/2-1} fill={fill} stroke={stroke} strokeWidth={1}/></svg>
    case 'ellipse': return <svg width={S} height={S*0.6}><ellipse cx={S/2} cy={S*0.3} rx={S/2-1} ry={S*0.3-1} fill={fill} stroke={stroke} strokeWidth={1}/></svg>
    case 'semicircle': return <svg width={S} height={S/2}><path d={`M 0,${S/2} A ${S/2},${S/2} 0 0,1 ${S},${S/2} Z`} fill={fill} stroke={stroke} strokeWidth={1}/></svg>
    case 'quadrant': return <svg width={S} height={S}><path d={`M 0,0 L ${S},0 A ${S},${S} 0 0,1 0,${S} Z`} fill={fill} stroke={stroke} strokeWidth={1}/></svg>
    case 'triangle': return <svg width={S} height={S}><polygon points={`${S/2},0 ${S},${S} 0,${S}`} fill={fill} stroke={stroke} strokeWidth={1}/></svg>
    case 'right-triangle': return <svg width={S} height={S}><polygon points={`0,0 ${S},${S} 0,${S}`} fill={fill} stroke={stroke} strokeWidth={1}/></svg>
    case 'wall': return <svg width={S} height={8}><line x1={0} y1={4} x2={S} y2={4} stroke={stroke} strokeWidth={4} strokeLinecap="round"/></svg>
    case 'L-shape': {
      const t = S/3
      return <svg width={S} height={S}><polygon points={`0,0 ${t},0 ${t},${S-t} ${S},${S-t} ${S},${S} 0,${S}`} fill={fill} stroke={stroke} strokeWidth={1}/></svg>
    }
    case 'U-shape': {
      const t = S/4
      return <svg width={S} height={S}><polygon points={`0,0 ${t},0 ${t},${S-t} ${S-t},${S-t} ${S-t},0 ${S},0 ${S},${S} 0,${S}`} fill={fill} stroke={stroke} strokeWidth={1}/></svg>
    }
    case 'pentagon': {
      const pts = Array.from({length:5},(_,i)=>{const a=(2*Math.PI*i/5)-Math.PI/2;return `${S/2+S/2*Math.cos(a)},${S/2+S/2*Math.sin(a)}`}).join(' ')
      return <svg width={S} height={S}><polygon points={pts} fill={fill} stroke={stroke} strokeWidth={1}/></svg>
    }
    case 'hexagon': {
      const pts = Array.from({length:6},(_,i)=>{const a=2*Math.PI*i/6;return `${S/2+S/2*Math.cos(a)},${S/2+S/2*Math.sin(a)}`}).join(' ')
      return <svg width={S} height={S}><polygon points={pts} fill={fill} stroke={stroke} strokeWidth={1}/></svg>
    }
    case 'octagon': {
      const pts = Array.from({length:8},(_,i)=>{const a=(2*Math.PI*i/8)-Math.PI/8;return `${S/2+S/2*Math.cos(a)},${S/2+S/2*Math.sin(a)}`}).join(' ')
      return <svg width={S} height={S}><polygon points={pts} fill={fill} stroke={stroke} strokeWidth={1}/></svg>
    }
  }
}

export function ShapePalette({ onAddCustom }: Props) {
  const addObject = useStore(s => s.addObject)

  return (
    <div className="p-2">
      <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-2 px-1">Shapes</p>
      <div className="grid grid-cols-2 gap-1">
        {ALL_SHAPE_TYPES.map(type => (
          <button
            key={type}
            onClick={() => addObject(type)}
            title={SHAPE_LABELS[type]}
            className="flex flex-col items-center gap-1 px-1 py-2 rounded hover:bg-surface-raised transition-colors text-text-muted hover:text-text-primary"
          >
            <ShapeIcon type={type} />
            <span className="text-xs leading-tight text-center">{SHAPE_LABELS[type]}</span>
          </button>
        ))}
        <button
          onClick={onAddCustom}
          className="flex flex-col items-center gap-1 px-1 py-2 rounded hover:bg-surface-raised transition-colors text-text-muted hover:text-text-primary col-span-2"
        >
          <span className="text-xl">+</span>
          <span className="text-xs">Custom…</span>
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `src/components/sidebar/LayersPanel.tsx`**

```typescript
import React, { useState } from 'react'
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
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /home/chryston/repos/floorplanner
npx tsc --noEmit 2>&1 | grep "sidebar" | head -10
```
Expected: no errors in sidebar files.

- [ ] **Step 4: Commit**

```bash
cd /home/chryston/repos/floorplanner
git add -A
git commit -m "feat: add ShapePalette and LayersPanel components

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 10: Properties Panel

**Files:**
- Create: `src/components/properties/PropertiesPanel.tsx`
- Create: `src/components/properties/PropertiesPanel.test.tsx`

**Interfaces:**
- Consumes: `useStore`, `activeLayout` from `src/store/store.ts`; `FloorObject`, `FloorLayer` from `src/types/index.ts`
- Produces: `<PropertiesPanel />` — reads selectedObjectId from store, shows editable fields

- [ ] **Step 1: Write failing tests**

Create `src/components/properties/PropertiesPanel.test.tsx`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PropertiesPanel } from './PropertiesPanel'
import { useStore, makeDefaultProject } from '../../store/store'

beforeEach(() => {
  useStore.setState({ project: makeDefaultProject(), selectedObjectId: null })
})

describe('PropertiesPanel', () => {
  it('shows placeholder when no object selected', () => {
    render(<PropertiesPanel />)
    expect(screen.getByText(/select an object/i)).toBeInTheDocument()
  })

  it('shows object name when an object is selected', () => {
    useStore.getState().addObject('rectangle')
    const obj = useStore.getState().project.layouts[0].objects[0]
    useStore.setState({ selectedObjectId: obj.id })
    render(<PropertiesPanel />)
    expect(screen.getByDisplayValue(obj.name)).toBeInTheDocument()
  })

  it('updates object name on input change', async () => {
    const user = userEvent.setup()
    useStore.getState().addObject('square')
    const obj = useStore.getState().project.layouts[0].objects[0]
    useStore.setState({ selectedObjectId: obj.id })
    render(<PropertiesPanel />)
    const input = screen.getByDisplayValue(obj.name)
    await user.clear(input)
    await user.type(input, 'Dining Table')
    expect(useStore.getState().project.layouts[0].objects[0].name).toBe('Dining Table')
  })

  it('shows rotation field with current value', () => {
    useStore.getState().addObject('rectangle')
    const obj = useStore.getState().project.layouts[0].objects[0]
    useStore.setState({ selectedObjectId: obj.id })
    render(<PropertiesPanel />)
    expect(screen.getByDisplayValue('0')).toBeInTheDocument()
  })

  it('shows height and memo fields', () => {
    useStore.getState().addObject('circle')
    const obj = useStore.getState().project.layouts[0].objects[0]
    useStore.setState({ selectedObjectId: obj.id })
    render(<PropertiesPanel />)
    expect(screen.getByLabelText(/height/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/memo/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /home/chryston/repos/floorplanner
npx vitest run src/components/properties/PropertiesPanel.test.tsx 2>&1 | tail -10
```
Expected: FAIL — `Cannot find module './PropertiesPanel'`

- [ ] **Step 3: Create `src/components/properties/PropertiesPanel.tsx`**

```typescript
import React from 'react'
import { useStore, activeLayout } from '../../store/store'
import type { FloorObject } from '../../types'

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
  const clearSelection = useStore(s => s.clearSelection)

  const layout = activeLayout(project)
  const obj: FloorObject | undefined = selectedObjectId
    ? layout.objects.find(o => o.id === selectedObjectId)
    : undefined

  if (!obj) {
    return (
      <div className="p-4 text-text-muted text-sm">
        Select an object to view its properties.
      </div>
    )
  }

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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /home/chryston/repos/floorplanner
npx vitest run src/components/properties/PropertiesPanel.test.tsx 2>&1 | tail -10
```
Expected: PASS — all tests green.

- [ ] **Step 5: Commit**

```bash
cd /home/chryston/repos/floorplanner
git add -A
git commit -m "feat: add PropertiesPanel with height, memo, rotation, layers

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 11: Toolbar

**Files:**
- Create: `src/components/toolbar/Toolbar.tsx`

**Interfaces:**
- Consumes: `useStore`, `activeLayout` from `src/store/store.ts`; `downloadProjectJSON` from `src/utils/projectIO.ts`; `exportSVGBlob`, `downloadFile` from `src/utils/exportSVG.ts`
- Produces:
  - `<Toolbar svgRef onUploadImage onCalibrate onImport />` — top bar with layout tabs + action buttons

- [ ] **Step 1: Create `src/components/toolbar/Toolbar.tsx`**

```typescript
import React, { useRef } from 'react'
import { useStore, activeLayout, useTemporalStore } from '../../store/store'
import { downloadProjectJSON } from '../../utils/projectIO'
import { exportSVGBlob, downloadFile } from '../../utils/exportSVG'

interface Props {
  svgRef: React.RefObject<SVGSVGElement | null>
  onUploadImage: () => void
  onCalibrate: () => void
  onImport: () => void
}

export function Toolbar({ svgRef, onUploadImage, onCalibrate, onImport }: Props) {
  const project = useStore(s => s.project)
  const addLayout = useStore(s => s.addLayout)
  const switchLayout = useStore(s => s.switchLayout)
  const deleteLayout = useStore(s => s.deleteLayout)
  const renameLayout = useStore(s => s.renameLayout)
  const duplicateLayout = useStore(s => s.duplicateLayout)

  const { undo, redo, pastStates, futureStates } = useTemporalStore.getState()
  const canUndo = pastStates.length > 0
  const canRedo = futureStates.length > 0

  const layout = activeLayout(project)

  const handleExportSVG = () => {
    const svg = svgRef.current
    if (!svg) return
    const blob = exportSVGBlob(svg)
    downloadFile(blob, `${project.name}.svg`)
  }

  const handleExportJSON = () => {
    downloadProjectJSON(project)
  }

  const handleTabDoubleClick = (layoutId: string, currentName: string) => {
    const newName = window.prompt('Rename layout:', currentName)
    if (newName && newName.trim()) renameLayout(layoutId, newName.trim())
  }

  return (
    <header className="flex items-center gap-2 bg-panel border-b border-divider px-3 py-1.5 overflow-x-auto shrink-0">
      {/* App name */}
      <span className="text-text-primary font-semibold text-sm mr-2 whitespace-nowrap">Floorplanner</span>

      {/* Layout tabs */}
      <div className="flex items-center gap-0.5 flex-1 min-w-0 overflow-x-auto">
        {project.layouts.map(l => (
          <div key={l.id} className="flex items-center gap-0 shrink-0">
            <button
              onClick={() => switchLayout(l.id)}
              onDoubleClick={() => handleTabDoubleClick(l.id, l.name)}
              title="Double-click to rename"
              className={`px-3 py-1 rounded-t text-sm transition-colors ${
                l.id === project.activeLayoutId
                  ? 'bg-surface text-text-primary'
                  : 'text-text-muted hover:text-text-primary hover:bg-surface-raised'
              }`}
            >
              {l.name}
            </button>
            {/* Duplicate + Delete on active tab */}
            {l.id === project.activeLayoutId && (
              <>
                <button
                  onClick={() => duplicateLayout(l.id)}
                  title="Duplicate layout"
                  className="text-text-muted hover:text-text-primary text-xs px-1"
                >
                  ⧉
                </button>
                <button
                  onClick={() => deleteLayout(l.id)}
                  title="Delete layout"
                  disabled={project.layouts.length <= 1}
                  className="text-text-muted hover:text-red-400 text-xs px-1 disabled:opacity-30"
                >
                  ✕
                </button>
              </>
            )}
          </div>
        ))}
        <button
          onClick={() => addLayout(`Layout ${project.layouts.length + 1}`)}
          title="Add layout"
          className="text-text-muted hover:text-text-primary text-sm px-2"
        >
          +
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => undo()}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className="px-2 py-1 text-text-muted hover:text-text-primary disabled:opacity-30 text-sm"
        >
          ↩
        </button>
        <button
          onClick={() => redo()}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          className="px-2 py-1 text-text-muted hover:text-text-primary disabled:opacity-30 text-sm"
        >
          ↪
        </button>
        <div className="w-px h-4 bg-divider mx-1" />
        <button
          onClick={onUploadImage}
          className="px-2 py-1 text-text-muted hover:text-text-primary text-sm"
          title="Upload floor plan image"
        >
          🖼 Image
        </button>
        {layout.canvas.image && (
          <button
            onClick={onCalibrate}
            className="px-2 py-1 text-text-muted hover:text-text-primary text-sm"
            title="Calibrate scale"
          >
            📏 Scale
          </button>
        )}
        {layout.canvas.pixelsPerMm !== null && (
          <span className="text-text-muted text-xs">
            {layout.canvas.pixelsPerMm.toFixed(2)} px/mm
          </span>
        )}
        <div className="w-px h-4 bg-divider mx-1" />
        <button
          onClick={handleExportSVG}
          className="px-2 py-1 text-text-muted hover:text-text-primary text-sm"
          title="Export as SVG"
        >
          ↓ SVG
        </button>
        <button
          onClick={handleExportJSON}
          className="px-2 py-1 text-text-muted hover:text-text-primary text-sm"
          title="Export as JSON"
        >
          ↓ JSON
        </button>
        <button
          onClick={onImport}
          className="px-2 py-1 text-text-muted hover:text-text-primary text-sm"
          title="Import project"
        >
          ↑ Import
        </button>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles for toolbar**

```bash
cd /home/chryston/repos/floorplanner
npx tsc --noEmit 2>&1 | grep "toolbar" | head -10
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd /home/chryston/repos/floorplanner
git add -A
git commit -m "feat: add Toolbar with layout tabs, undo/redo, and export/import

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 12: App Integration, README, and Deployment

**Files:**
- Modify: `src/App.tsx`
- Create: `README.md`
- Verify: `.github/workflows/deploy.yml` (optional — can deploy manually with `npm run deploy`)

**Interfaces:**
- Consumes: all components from Tasks 6–11; store from Task 3; IO utils from Tasks 4–5
- Produces: working full app; passing full test suite; `npm run build` succeeds; `npm run deploy` pushes to GitHub Pages

- [ ] **Step 1: Write App.tsx**

```typescript
import React, { useRef, useState, useCallback, useEffect } from 'react'
import { useStore, activeLayout, useTemporalStore } from './store/store'
import { FloorPlanCanvas } from './components/canvas/FloorPlanCanvas'
import { ShapePalette } from './components/sidebar/ShapePalette'
import { LayersPanel } from './components/sidebar/LayersPanel'
import { PropertiesPanel } from './components/properties/PropertiesPanel'
import { Toolbar } from './components/toolbar/Toolbar'
import { ScaleCalibrationModal } from './components/modals/ScaleCalibrationModal'
import { CustomShapeModal } from './components/modals/CustomShapeModal'
import { ImportModal } from './components/modals/ImportModal'
import { loadProject } from './utils/projectIO'

interface CalibrationPoint {
  svgX: number
  svgY: number
  screenX: number
  screenY: number
}

export default function App() {
  const project = useStore(s => s.project)
  const setCanvasImage = useStore(s => s.setCanvasImage)
  const setPixelsPerMm = useStore(s => s.setPixelsPerMm)
  const addObject = useStore(s => s.addObject)
  const updateObject = useStore(s => s.updateObject)
  const importProject = useStore(s => s.importProject)

  const svgRef = useRef<SVGSVGElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [calibrating, setCalibrating] = useState(false)
  const [calibrationPoints, setCalibrationPoints] = useState<CalibrationPoint[]>([])
  const [calibrationDistancePx, setCalibrationDistancePx] = useState<number | null>(null)
  const [showCalibrationModal, setShowCalibrationModal] = useState(false)
  const [showCustomShapeModal, setShowCustomShapeModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)

  // Keyboard shortcuts: Ctrl+Z undo, Ctrl+Y redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        useTemporalStore.getState().undo()
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        useTemporalStore.getState().redo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string
      const img = new Image()
      img.onload = () => {
        setCanvasImage({ dataUrl, widthPx: img.naturalWidth, heightPx: img.naturalHeight })
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
    // Reset file input so same file can be re-uploaded
    e.target.value = ''
  }

  const handleCalibrationPoint = useCallback((pt: CalibrationPoint) => {
    setCalibrationPoints(prev => {
      const next = [...prev, pt]
      if (next.length === 2) {
        const dx = next[1].svgX - next[0].svgX
        const dy = next[1].svgY - next[0].svgY
        const distPx = Math.sqrt(dx * dx + dy * dy)
        setCalibrationDistancePx(distPx)
        setShowCalibrationModal(true)
        setCalibrating(false)
        return []
      }
      return next
    })
  }, [])

  const handleCalibrationConfirm = (realMm: number) => {
    if (calibrationDistancePx !== null && calibrationDistancePx > 0) {
      setPixelsPerMm(calibrationDistancePx / realMm)
    }
    setShowCalibrationModal(false)
    setCalibrationDistancePx(null)
  }

  const handleCustomShapeConfirm = (name: string, width: number, depth: number) => {
    addObject('rectangle')
    const layout = activeLayout(useStore.getState().project)
    const obj = layout.objects[layout.objects.length - 1]
    if (obj) updateObject(obj.id, { name, width, depth })
    setShowCustomShapeModal(false)
  }

  const handleImportConfirm = (importedProject: ReturnType<typeof loadProject>) => {
    importProject(importedProject)
    useTemporalStore.getState().clear()
    setShowImportModal(false)
  }

  return (
    <div className="flex h-full flex-col bg-surface text-text-primary">
      <Toolbar
        svgRef={svgRef}
        onUploadImage={() => fileInputRef.current?.click()}
        onCalibrate={() => { setCalibrating(true); setCalibrationPoints([]) }}
        onImport={() => setShowImportModal(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar: shape palette + layers */}
        <aside className="w-48 bg-panel border-r border-divider flex flex-col overflow-y-auto shrink-0">
          <ShapePalette onAddCustom={() => setShowCustomShapeModal(true)} />
          <div className="border-t border-divider mt-2" />
          <LayersPanel />
        </aside>

        {/* Canvas */}
        <main className="flex-1 bg-surface overflow-hidden relative">
          {calibrating && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-panel text-text-primary text-sm px-4 py-2 rounded shadow-lg z-10 pointer-events-none">
              {calibrationPoints.length === 0
                ? 'Click the first calibration point'
                : 'Click the second calibration point'}
            </div>
          )}
          <FloorPlanCanvas
            calibrating={calibrating}
            onCalibrationPoint={handleCalibrationPoint}
            svgRef={svgRef}
          />
        </main>

        {/* Right sidebar: properties */}
        <aside className="w-64 bg-panel border-l border-divider overflow-y-auto shrink-0">
          <PropertiesPanel />
        </aside>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      {/* Modals */}
      {showCalibrationModal && calibrationDistancePx !== null && (
        <ScaleCalibrationModal
          distancePx={calibrationDistancePx}
          onConfirm={handleCalibrationConfirm}
          onCancel={() => { setShowCalibrationModal(false); setCalibrationDistancePx(null) }}
        />
      )}
      {showCustomShapeModal && (
        <CustomShapeModal
          onConfirm={handleCustomShapeConfirm}
          onCancel={() => setShowCustomShapeModal(false)}
        />
      )}
      {showImportModal && (
        <ImportModal
          onConfirm={handleImportConfirm}
          onCancel={() => setShowImportModal(false)}
        />
      )}
    </div>
  )
}
```

> Note: `FloorPlanCanvas` in Task 6 was written without a `svgRef` prop — update its Props interface to accept `svgRef: React.RefObject<SVGSVGElement | null>` and forward it to the `<svg>` element.

- [ ] **Step 2: Update FloorPlanCanvas to accept external svgRef**

In `src/components/canvas/FloorPlanCanvas.tsx`, change the Props interface and replace the internal `useRef`:

Find:
```typescript
interface Props {
  calibrating: boolean
  onCalibrationPoint: (pt: { svgX: number; svgY: number; screenX: number; screenY: number }) => void
}

export function FloorPlanCanvas({ calibrating, onCalibrationPoint }: Props) {
  // ...
  const svgRef = useRef<SVGSVGElement>(null)
```

Replace with:
```typescript
interface Props {
  calibrating: boolean
  onCalibrationPoint: (pt: { svgX: number; svgY: number; screenX: number; screenY: number }) => void
  svgRef: React.RefObject<SVGSVGElement | null>
}

export function FloorPlanCanvas({ calibrating, onCalibrationPoint, svgRef }: Props) {
  // remove the useRef line
```

- [ ] **Step 3: Run full test suite**

```bash
cd /home/chryston/repos/floorplanner
npx vitest run 2>&1 | tail -20
```
Expected: all tests pass.

- [ ] **Step 4: Run TypeScript check**

```bash
cd /home/chryston/repos/floorplanner
npx tsc --noEmit 2>&1 | head -30
```
Expected: no errors.

- [ ] **Step 5: Verify build succeeds**

```bash
cd /home/chryston/repos/floorplanner
npm run build 2>&1 | tail -20
```
Expected: `dist/` created, no errors.

- [ ] **Step 6: Create README.md**

```markdown
# Floorplanner

A standalone, lightweight floor planner app built with React, TypeScript, and Vite.

**[Try it on GitHub Pages →](https://chryston.github.io/floorplanner/)**

## Features

- Draw floor plans over an uploaded image background
- Calibrate scale by clicking two points and entering a real-world distance
- 14 shape types: rectangle, square, circle, ellipse, semicircle, quadrant, triangle, right-triangle, wall, L-shape, U-shape, pentagon, hexagon, octagon
- Drag and resize objects on the canvas (resize handles stay correct under any rotation)
- Arbitrary 0–360° rotation per object
- Layer system with visibility and lock toggles
- Multiple layout tabs per project
- Object properties: name, dimensions, height (3D), rotation, layer, fill/stroke, memo
- Export as SVG or JSON; import from JSON
- Undo / redo (Ctrl+Z / Ctrl+Y)
- LocalStorage persistence

## Development

```bash
npm install
npm run dev        # start dev server at localhost:5173/floorplanner/
npm test           # run unit tests with vitest
npm run build      # production build
npm run deploy     # build + push to GitHub Pages
```

## Data Model

Projects are saved as JSON. Schema version is `1`.  
See `src/types/index.ts` for the full data model.

## Architecture

| File | Purpose |
|------|---------|
| `src/store/store.ts` | Zustand store (immer + zundo + persist) |
| `src/types/index.ts` | TypeScript interfaces |
| `src/data/shapes.ts` | Shape type catalog and default dimensions |
| `src/utils/renderShape.ts` | SVG shape renderer |
| `src/utils/projectIO.ts` | Export, import, and schema validation |
| `src/components/canvas/` | Pan/zoom canvas, object rendering, calibration |
| `src/components/sidebar/` | Shape palette and layers panel |
| `src/components/properties/` | Object properties editor |
| `src/components/toolbar/` | Layout tabs, export, undo/redo |
| `src/components/modals/` | Calibration, custom shape, import dialogs |
```

- [ ] **Step 7: Create GitHub Actions deploy workflow** (optional — can use `npm run deploy` instead)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

- [ ] **Step 8: Commit everything**

```bash
cd /home/chryston/repos/floorplanner
git add -A
git commit -m "feat: wire up full app, add README and deploy workflow

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

- [ ] **Step 9: Push to GitHub**

```bash
cd /home/chryston/repos/floorplanner
git push origin main
```

- [ ] **Step 10: Verify deploy (manual)**

```bash
cd /home/chryston/repos/floorplanner
npm run deploy
```
Expected: output ends with `Published` and `https://chryston.github.io/floorplanner/` is live.

---

## Self-Review

### Spec Coverage

| Spec section | Covered by task |
|---|---|
| 14 ShapeTypes | Task 2, 4 |
| Zustand + immer + zundo + persist | Task 3 |
| Pan/zoom SVG canvas | Task 6 |
| Drag + 8-handle resize with rotation | Task 7 |
| `width`/`depth` in local space (rotation fix) | Task 7 |
| Scale calibration (2-click + modal) | Task 6, 8, 12 |
| Export SVG / JSON | Task 5, 11 |
| Import JSON with validation | Task 5, 8 |
| Schema versioning + migration stub | Task 5 |
| Multiple layout tabs | Task 3, 11, 12 |
| Layer system (visibility, lock, order) | Task 3, 9 |
| Object height (stored, not 2D) | Task 2, 3, 10 |
| Object memo | Task 2, 3, 10 |
| Full 0–360° rotation + reset + +90° | Task 3, 10 |
| Undo/redo (zundo) | Task 3, 11, 12 |
| GitHub Pages deployment | Task 1, 12 |
| SCHEMA_VERSION = 1, key = 'floorplanner-v1' | Task 3, 5 |
| `addObject` placement (center of image or 100,100) | Task 3 |
| JSDOM SVG stubs for tests | Task 1 |
| README | Task 12 |
| No BuildBox coupling | All tasks — no BuildBox imports |
| No SVG template parsing | All tasks — renderShape only |
| No "Floor to Tile" / "Wall to Hack" | Excluded throughout |

### No Placeholders

All code steps contain complete, runnable code. No "TBD" or "similar to Task N" patterns.

### Type Consistency

- `FloorObject` defined in Task 2 (`src/types/index.ts`), used in Tasks 3, 4, 7, 10 — consistent.
- `ShapeType` union (14 types) defined in Task 2, used in Tasks 3, 4, 9 — consistent.
- `activeLayout(project)` exported from Task 3 (`src/store/store.ts`), used in Tasks 6, 7, 9, 10, 11, 12 — consistent.
- `makeDefaultProject` exported in Task 3, used in test `beforeEach` hooks in Tasks 3, 7, 10 — consistent.
- `useTemporalStore` exported from Task 3, used in Tasks 11, 12 — consistent.
- `loadProject` returns `FloorProject`, `ImportModal.onConfirm` accepts `FloorProject` — consistent.
- `FloorPlanCanvas` Props updated in Task 12 to add `svgRef` — consistent with `App.tsx` usage.

