# Floor Planner — Standalone App Design Spec

**Date:** 2026-06-30  
**Author:** Copilot (brainstorming session)  
**Status:** Approved  
**Source project:** BuildBox (`chryston/buildbox`) — extracting the floor planner module  
**Target repository:** `chryston/floorplanner`

---

## 1. Overview

Extract the floor planner module from BuildBox and turn it into a lightweight, standalone static-site application deployable to GitHub Pages. The standalone app focuses exclusively on 2D floor planning: uploading a room photo, placing geometric objects on it, organising them with layers, and exporting/importing the project as JSON.

### Goals

- Clean standalone app — zero coupling to BuildBox cabinet-planner logic
- Image-based canvas (upload background, calibrate scale)
- Objects represented as generic geometric shapes (not furniture catalog)
- Multiple layouts per project (tabbed)
- Layers system (visibility, lock, order)
- Full undo/redo from day one
- Object properties: name, width, depth, height, rotation (0–360°), memo, layer
- JSON project export/import with schema versioning
- Deployable to `chryston.github.io/floorplanner`

### Non-goals for v1

- Grid/grid-snap canvas (canvas is image-based, no grid)
- Furniture catalog / preset library (future feature — extensible architecture planned)
- Annotation drawing tools ("Wall to Hack", "Floor to Tile" — removed)
- Multi-user / cloud sync

---

## 2. Technology Stack

| Concern | Choice | Rationale |
|---|---|---|
| Framework | React 19 + TypeScript | Same as BuildBox; proven |
| Build | Vite | Fast DX, static output |
| Styling | Tailwind CSS v3 | Already used in BuildBox; carry over CSS variables |
| State | Zustand + Immer | Minimal boilerplate |
| Undo/redo | zundo | Same temporal middleware used in BuildBox (cabinet side) |
| Testing | Vitest + @testing-library/react | Same as BuildBox |
| Deployment | gh-pages | Static output to GitHub Pages |
| ID generation | nanoid | Same as BuildBox |

---

## 3. Data Model

```ts
// Current schema version — bump on breaking change
const SCHEMA_VERSION = 1

type ShapeType =
  | "rectangle"
  | "square"
  | "circle"
  | "ellipse"
  | "semicircle"
  | "quadrant"        // quarter-circle arc
  | "triangle"        // isoceles/equilateral in bounding box
  | "right-triangle"
  | "wall"            // 1D line segment (thin stroke, no fill)
  | "L-shape"
  | "U-shape"
  | "pentagon"
  | "hexagon"
  | "octagon"

interface FloorProject {
  schemaVersion: number
  id: string
  name: string
  layouts: FloorLayout[]
  activeLayoutId: string
  createdAt: string    // ISO 8601
  updatedAt: string    // ISO 8601
}

interface FloorLayout {
  id: string
  name: string
  objects: FloorObject[]
  layers: FloorLayer[]
  canvas: CanvasSettings
  memo?: string
}

interface FloorLayer {
  id: string
  name: string
  visible: boolean
  locked: boolean
  order: number        // lower = rendered first (bottom)
}

interface FloorObject {
  id: string
  name: string         // user-defined label
  shapeType: ShapeType
  layerId: string
  x: number            // top-left corner of bounding box (unrotated)
  y: number
  width: number        // local, always unrotated
  depth: number        // local, always unrotated (formerly "h")
  height: number       // 3D height — stored, editable, no 2D effect in v1
  rotation: number     // degrees, 0–360 (visual SVG transform only)
  memo?: string
  fill?: string        // CSS color
  stroke?: string      // CSS color
  locked?: boolean     // prevents pointer interaction
  visible?: boolean    // false = not rendered
}

interface CanvasSettings {
  image: FloorPlanImage | null
  pixelsPerMm: number | null    // set after scale calibration
}

interface FloorPlanImage {
  dataUrl: string      // base64-encoded data URL
  widthPx: number
  heightPx: number
}
```

### Key differences from BuildBox

| BuildBox | Standalone | Why |
|---|---|---|
| `type: FloorPlanObjectType` | `shapeType: ShapeType` | Generic geometry, not furniture names |
| `w`, `h` | `width`, `depth` | Unambiguous; always local/unrotated |
| `rotation: 0 \| 90 \| 180 \| 270` | `rotation: number` | Full 0–360° support |
| No `height`, `memo`, `layerId` | `height`, `memo`, `layerId` added | New properties |
| `canvas` settings in store root | `canvas` inside `FloorLayout` | Each layout has its own image |
| No layouts | `FloorLayout[]` in project | Multiple rooms/floors |

---

## 4. Repository Structure

```
floorplanner/
├── public/
├── src/
│   ├── components/
│   │   ├── canvas/
│   │   │   ├── FloorPlanCanvas.tsx       # Pan/zoom SVG canvas
│   │   │   ├── PlacedObject.tsx          # Individual object: drag, resize, rotate
│   │   │   └── CalibrationOverlay.tsx    # Two-point scale calibration
│   │   ├── sidebar/
│   │   │   ├── ShapePalette.tsx          # Shape type buttons
│   │   │   └── LayersPanel.tsx           # Layer list with visibility/lock/reorder
│   │   ├── properties/
│   │   │   └── PropertiesPanel.tsx       # Object properties editor
│   │   ├── toolbar/
│   │   │   └── Toolbar.tsx               # Layout tabs + export/import/undo/redo
│   │   └── modals/
│   │       ├── ScaleCalibrationModal.tsx # Confirm scale after calibration
│   │       ├── CustomShapeModal.tsx      # Save custom shape template
│   │       └── ImportModal.tsx           # Import JSON — replace or merge
│   ├── store/
│   │   └── store.ts                      # Zustand + Immer + zundo
│   ├── types/
│   │   └── index.ts                      # All type definitions
│   ├── data/
│   │   └── shapes.ts                     # ShapeType catalog with defaults
│   ├── utils/
│   │   ├── exportSVG.ts                  # SVG download (copied from BuildBox)
│   │   ├── projectIO.ts                  # JSON import/export + schema migration
│   │   └── renderShape.ts                # ShapeType → SVG element/path
│   ├── test/
│   │   └── setup.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json
└── package.json
```

---

## 5. State Management

### Store shape

```ts
interface StoreState {
  project: FloorProject
  selectedObjectId: string | null
}
```

`project.activeLayoutId` is the source of truth for which layout is active.

### Actions

**Layout management:**
- `createLayout(name?: string)` — adds layout, sets it active
- `renameLayout(id, name)`
- `duplicateLayout(id)` — deep clone with new IDs
- `deleteLayout(id)` — refuses if it's the last layout
- `switchLayout(id)`

**Object management:**
- `addObject(shapeType, layerId?)` — default size from `shapes.ts`, places at centre of the background image (or at 100,100 if no image uploaded)
- `updateObject(id, patch: Partial<FloorObject>)` — Immer patch
- `removeObject(id)`
- `selectObject(id | null)`

**Layer management:**
- `addLayer(name?)` — appends, assigns to top
- `renameLayer(id, name)`
- `setLayerVisibility(id, visible)`
- `setLayerLocked(id, locked)`
- `reorderLayer(id, newOrder)` — adjusts all other `order` values
- `deleteLayer(id)` — reassigns its objects to the default layer before deleting

**Canvas:**
- `setCanvasImage(layoutId, image | null)`
- `setCanvasScale(layoutId, pixelsPerMm)`
- `clearCanvas(layoutId)` — removes objects, annotations, resets image/scale

**Project:**
- `importProject(incoming: FloorProject)` — replaces current project (after validation)
- `loadSchema(raw: unknown): FloorProject` — validates + migrates (see §7)

### Undo/redo

zundo wraps the entire `project` key. `selectedObjectId` is excluded (UI state only).  
The `partialize` function selects only `project` for temporal tracking.

### Persistence

Persisted via Zustand `persist` middleware to `localStorage` key `floorplanner-v1`.  
`partialize` saves the full `project`. `selectedObjectId` is not persisted.

---

## 6. Canvas & Rendering

### FloorPlanCanvas

- SVG element fills the container
- `<g transform="matrix(zoom,0,0,zoom,panX,panY)">` wraps all content
- Background `<image>` rendered when `canvas.image` is set; otherwise a neutral `<rect>` placeholder
- Objects rendered as `<PlacedObject>` in layer order (hidden layers skipped)
- Pan: left-click drag (no active mode), or middle-button drag
- Zoom: scroll wheel (centred on cursor), min 0.1×, max 10×
- "Fit to screen" button centres and fits the background image
- Scale calibration: two-click interaction via `CalibrationOverlay` → `ScaleCalibrationModal`

### PlacedObject

Each object renders as:

```
<g transform="rotate(rotation, cx, cy)">    ← visual rotation
  {renderShape(obj)}                         ← shape primitive
  <text>name</text>                          ← label at centre
  {isSelected && <handles />}                ← 8 resize handles
</g>
```

`renderShape(obj)` returns the appropriate SVG element(s) using `obj.width` and `obj.depth` in local space. Locked or invisible objects are skipped or non-interactive.

### Resize handles

8 handles (nw, n, ne, e, se, s, sw, w) rendered in local (unrotated) space. Pointer move deltas are projected into object-local coordinates using `rotate(-rotation)` before adjusting `width`/`depth`. This ensures `width`/`depth` never change meaning when rotation changes.

### Shape rendering — `renderShape(obj)`

| ShapeType | SVG output |
|---|---|
| `rectangle` / `square` | `<rect x y width depth rx>` |
| `circle` | `<circle cx=w/2 cy=d/2 r=min(w,d)/2>` |
| `ellipse` | `<ellipse cx=w/2 cy=d/2 rx=w/2 ry=d/2>` |
| `semicircle` | Arc path — top half of ellipse |
| `quadrant` | Arc path — top-right quarter |
| `triangle` | `<polygon>` — isoceles, apex at top centre |
| `right-triangle` | `<polygon>` — right-angle at bottom-left |
| `wall` | `<line x1=0 y1=d/2 x2=w y2=d/2>` (thin, stroke only) |
| `L-shape` | `<polygon>` — L in bounding box (top-left notch removed) |
| `U-shape` | `<polygon>` — U in bounding box (bottom-centre notch removed) |
| `pentagon`…`octagon` | `<polygon>` — regular n-gon inscribed in `min(w,d)/2` radius |

All shapes are rendered with `fill` (default per-shape) and `stroke` from `FloorObject`.

---

## 7. Project Import/Export

### Export (JSON)

Exports the full `FloorProject` as JSON:

```json
{
  "schemaVersion": 1,
  "id": "...",
  "name": "My Floor Plan",
  "layouts": [...],
  "activeLayoutId": "...",
  "createdAt": "...",
  "updatedAt": "..."
}
```

Updates `updatedAt` on export. Background image `dataUrl` is included in the export (self-contained file).

### Import (JSON)

1. User selects a `.json` file
2. Parse JSON — catch syntax errors
3. Validate required top-level fields (`schemaVersion`, `id`, `layouts`, etc.)
4. Run schema migration if `schemaVersion < SCHEMA_VERSION`
5. Validate each layout and object structure — reject or skip malformed items
6. Confirm replace vs. cancel (v1: always replace current project)
7. Load into store, clear undo history

### Schema migration

```ts
function migrateProject(raw: unknown, fromVersion: number): FloorProject
```

Each version bump adds a migration step. Current version is 1 (first release), so no migrations yet. Architecture is the same as BuildBox's `migrate` callback.

### Export SVG

Serialises the current canvas SVG element (selected object deselected first to hide handles), sets explicit `width`/`height` from `getBoundingClientRect()`, downloads as `.svg`. Adapted directly from BuildBox `exportSVG.ts`.

---

## 8. UI Panels

### Toolbar (top)

- App name / logo (left)
- Layout tabs: each layout shown as a tab; active tab highlighted; double-click to rename; right-click or button to duplicate/delete; `+` to add new layout
- Upload Image button (triggers file picker → `setCanvasImage`)
- Calibrate Scale button (disabled until image uploaded)
- Scale indicator (e.g. `1px = 0.25mm`) when calibrated
- Export SVG, Export JSON, Import JSON
- Undo / Redo (with keyboard shortcut: Ctrl+Z / Ctrl+Y)

### Sidebar (left)

**Shape Palette section:**
- One button per `ShapeType` (icon + label)
- Clicking adds a default-sized object to the active layer at canvas centre
- "Add Custom Shape" button → `CustomShapeModal` → saves user template

**Layers Panel section:**
- List of layers for the active layout
- Per-layer: visibility eye icon, lock icon, name (click to rename), drag handle to reorder
- "Add Layer" button at bottom

### Properties Panel (right)

Shown when an object is selected, empty state otherwise.

Fields:
- **Name** — text input
- **Shape** — read-only label (shape type)
- **Width (mm)** — number input, always in local/unrotated coords
- **Depth (mm)** — number input, always in local/unrotated coords
- **Height (mm)** — number input (3D, stored, no 2D effect)
- **Rotation** — number input (0–360°) + "Reset to 0°" button + "Rotate 90°" button
- **Layer** — dropdown of available layers
- **Fill color** — color swatches
- **Stroke color** — color swatches
- **Memo** — textarea
- **Delete** — red button

---

## 9. Migration Map

| BuildBox file | Standalone fate | Action |
|---|---|---|
| `components/FloorPlan/FloorPlanPage.tsx` | `App.tsx` | Adapt — remove BuildBox store/routing, becomes app root |
| `components/FloorPlan/FloorPlanCanvas.tsx` | `components/canvas/FloorPlanCanvas.tsx` | Adapt — swap `useStore`, remove AnnotationLayer |
| `components/FloorPlan/PlacedObject.tsx` | `components/canvas/PlacedObject.tsx` | Adapt — swap `useStore`, call `renderShape()`, fix rotation |
| `components/FloorPlan/FloorPlanSidebar.tsx` | `components/sidebar/ShapePalette.tsx` | Rewrite — shape palette, not furniture catalog |
| `components/FloorPlan/FloorPlanProperties.tsx` | `components/properties/PropertiesPanel.tsx` | Adapt — add height, memo, layer, full rotation |
| `components/FloorPlan/AnnotationLayer.tsx` | *(excluded)* | Removed in v1 |
| `components/FloorPlan/CalibrationOverlay.tsx` | `components/canvas/CalibrationOverlay.tsx` | Copy as-is |
| `components/FloorPlan/ScaleCalibrationModal.tsx` | `components/modals/ScaleCalibrationModal.tsx` | Copy as-is |
| `components/FloorPlan/CustomShapeModal.tsx` | `components/modals/CustomShapeModal.tsx` | Adapt — rename "template" to "custom shape" |
| `data/floorPlanObjects.ts` | `data/shapes.ts` | Rewrite — shape catalog with default dimensions |
| `utils/floorPlanExport.ts` | `utils/projectIO.ts` | Rewrite — full project IO + schema versioning |
| `utils/exportSVG.ts` | `utils/exportSVG.ts` | Copy as-is |
| `types/index.ts` (floor plan slice) | `types/index.ts` | Rewrite — clean standalone types only |
| `store/store.ts` (floor plan slice) | `store/store.ts` | Rewrite — floor plan only + zundo |
| `src/index.css` (CSS variables) | `src/index.css` | Copy as-is |
| Cabinet engine, cabinet components | *(excluded)* | Do not migrate |
| `ModuleSwitcher`, `ProjectTabs`, `Toolbar` | *(excluded)* | Do not migrate (replaced by new Toolbar) |

---

## 10. Known Issues Fixed

| BuildBox bug | Fix in standalone |
|---|---|
| `rotation: 0 \| 90 \| 180 \| 270` only | `rotation: number` — full 0–360° |
| Width/depth confused when object is rotated | `width`/`depth` always in local space; resize delta projected via `rotate(-rotation)` |
| `getSvgScale()` returns 1 when SVG has no viewBox | Fixed: compute scale from `getBoundingClientRect()` vs natural SVG size |
| "Wall to Hack" / "Floor to Tile" do nothing | Removed entirely in v1 |
| `AnnotationLayer` — `wall-hack` / `tile-zone` do nothing | Removed entirely in v1 |
| Floor plan has no undo/redo in BuildBox | zundo wraps the full `project` key |

---

## 11. Testing Plan

| Test file | Coverage |
|---|---|
| `types/shapes.test.ts` | ShapeType catalog: all types present, default dims valid |
| `utils/projectIO.test.ts` | Export round-trip; import valid file; schema migration v0→v1; reject malformed JSON; reject missing required fields |
| `utils/renderShape.test.ts` | Each ShapeType produces expected SVG element; rotation does not change width/depth |
| `store/store.test.ts` | Layout CRUD; object CRUD; layer CRUD; undo/redo; persistence |
| `components/canvas/PlacedObject.test.tsx` | Renders by shapeType; selection; resize handles; rotation |
| `components/properties/PropertiesPanel.test.tsx` | All fields; width/depth stay local; memo; height; rotation reset |
| `integration/floorPlanFlow.test.tsx` | Add shape → move → resize → export JSON → import JSON → verify state |

---

## 12. Deployment

```json
// package.json (key fields)
{
  "homepage": "https://chryston.github.io/floorplanner",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "deploy": "npm run build && gh-pages -d dist"
  }
}
```

```ts
// vite.config.ts
export default defineConfig({
  base: '/floorplanner/',
  plugins: [react()],
})
```

`gh-pages` deploys the `dist/` folder to the `gh-pages` branch of `chryston/floorplanner`.

---

## 13. Implementation Phases

| Phase | Scope |
|---|---|
| **1** | Scaffold: Vite + TS + Tailwind + Vitest; configure GitHub Pages; empty app shell |
| **2** | Types, store, shapes catalog |
| **3** | Canvas: pan/zoom, image upload, scale calibration |
| **4** | Shape rendering: `renderShape()` + all shape types |
| **5** | PlacedObject: drag, resize, rotation |
| **6** | Sidebar (ShapePalette), Properties panel, Layers panel |
| **7** | Layout tabs |
| **8** | Project JSON import/export |
| **9** | Undo/redo (zundo) |
| **10** | Tests, README, deploy |
