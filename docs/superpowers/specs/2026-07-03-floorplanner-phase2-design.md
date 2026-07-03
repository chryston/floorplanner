# Floor Planner — Phase 2 Design Spec

**Date:** 2026-07-03  
**Author:** Copilot (brainstorming session)  
**Status:** Approved  
**Repository:** `chryston/floorplanner`

---

## 1. Overview

Upgrade the existing static floor-planning app from a calibrated SVG shape editor into a more practical 2D floor-planning tool. Phase 2 adds grid overlay, snap-to-grid, dimension labels, dimension-line annotations, improved wall drawing, and door/window objects.

Existing capabilities must not regress.

---

## 2. Non-Goals

- Backend, user accounts, cloud storage, collaboration
- 3D/photorealistic rendering
- Fabric.js / Konva.js / Three.js
- CAD/DXF export
- Room auto-detection
- Furniture catalog expansion

---

## 3. Features

### 3.1 Grid Overlay

SVG grid rendered behind all objects. Uses SVG `<pattern>` to avoid rendering individual lines.

**Default state:**
```ts
grid: {
  enabled: true,
  minorSpacingMm: 100,
  majorSpacingMm: 1000,
  showMinor: true,
  showMajor: true,
}
```

**Minor spacing options:** 50 / 100 / 250 / 500 / 1000 mm. Major spacing = 10× minor.

**Rules:**
- Grid pans and scales with canvas transform
- Aligned to world coordinates (mm)
- Togglable on/off
- Not included in SVG export by default
- Settings persist in LocalStorage and JSON

**Acceptance criteria:**
- Grid visible on load
- Stays aligned while panning
- Scales correctly while zooming
- Toggle hides/shows
- Spacing changes apply correctly
- Settings survive reload

---

### 3.2 Snap-to-Grid

**Default state:**
```ts
snap: {
  enabled: true,
  spacingMm: 100,
}
```

**Applies to:** object creation, drag, resize, dimension-line endpoints, wall start/end, door/window placement.

**Modifier:** Alt/Option disables snapping temporarily. Shift reserved for wall angle constraint.

**Helpers to add:**
```ts
snapValue(value: number, spacing: number): number
snapPoint(point: {x: number; y: number}, spacing: number): {x: number; y: number}
```

**Acceptance criteria:**
- Moving/resizing objects snaps
- New objects placed on snapped coords
- Alt/Option bypasses snap
- Setting survives reload

---

### 3.3 Selected-Object Dimension Labels

Inline SVG text overlay shown when an object is selected. Not exported.

**Shows:**
```
1200 × 600 mm
Rot 45°        (only when rotation ≠ 0)
```

**Rules:**
- Updates live during drag/resize
- `pointer-events="none"` — does not block interaction
- Font size in screen px (readable at any zoom)
- Hidden when nothing selected

**Acceptance criteria:**
- Labels appear on selection
- Update during resize
- Stay attached while moving
- Work for rotated objects
- Do not interfere with drag/resize

---

### 3.4 Dimension-Line Annotations

Persistent measurement annotations. Two-click placement.

**Data model:**
```ts
type DimensionAnnotation = {
  id: string;
  type: 'dimension';
  name?: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
  offsetMm?: number;
  layerId?: string;
  locked?: boolean;
  visible?: boolean;
  memo?: string;
};
```

**Rendering:**
- Tick marks or arrowheads at endpoints
- Distance label centred on line, with background rect for readability
- Format: `850 mm` (< 1000 mm) or `1.20 m` (≥ 1000 mm)

**Rules:**
- Horizontal, vertical, diagonal
- Stored in mm
- Selectable, deletable
- Included in undo/redo, LocalStorage, JSON, SVG export

**Acceptance criteria:**
- Dimension tool creates line with preview
- Displayed distance is correct
- Survives reload
- JSON/SVG export works
- Undo/redo works

---

### 3.5 Improved Wall Drawing

New wall segment objects coexist with legacy wall shapes (which continue to render).

**New data model:**
```ts
type WallObject = {
  id: string;
  type: 'wall';
  name: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
  thicknessMm: number;
  heightMm?: number;
  layerId?: string;
  locked?: boolean;
  visible?: boolean;
  stroke?: string;
  fill?: string;
  memo?: string;
};
```

**Default thickness:** 100 mm.

**Draw flow:** click start → move (preview) → click end → endpoint becomes next start → Esc exits.

**Rules:**
- Shift constrains angle to 45° increments
- Alt/Option disables snap
- Endpoints snap to grid and to nearby wall endpoints (if practical)
- Live length shown during drawing
- Selected wall shows endpoint handles (draggable) and whole-wall drag
- Properties panel shows: length, thickness, start, end, angle

**Backward compat:** legacy `wall` shape objects still render; JSON remains importable.

**Acceptance criteria:**
- Click-to-draw works; continuous drawing works
- Esc exits
- Shift angle constraint works
- Length preview appears
- Thickness editable
- Endpoint handles work
- Legacy walls still render
- JSON/SVG/undo work

---

### 3.6 Doors and Windows

Semantic objects attached to wall segments.

**Data models:**
```ts
type DoorObject = {
  id: string;
  type: 'door';
  name: string;
  wallId: string;
  offsetMm: number;       // from wall start
  widthMm: number;
  swingDirection: 'left' | 'right';
  swingAngleDeg: number;
  layerId?: string;
  locked?: boolean;
  visible?: boolean;
  memo?: string;
};

type WindowObject = {
  id: string;
  type: 'window';
  name: string;
  wallId: string;
  offsetMm: number;
  widthMm: number;
  layerId?: string;
  locked?: boolean;
  visible?: boolean;
  memo?: string;
};
```

**Defaults:** door 900 mm / 90° swing / left; window 1200 mm.

**Place flow:** select tool → hover wall (preview snaps to nearest point) → click to place.

**Rendering:**
- Door: leaf + arc swing, aligned to wall angle
- Window: clear symbol centred on wall, distinct from wall fill
- No boolean wall cutouts (visual overlay only)

**Position derivation:** offset stored; rendered position derived from parent wall geometry at render time.

**Rules:**
- Draggable along parent wall; clamped within wall length
- Width editable; swing direction/angle editable (door)
- Layer/lock/visible consistent with other objects
- Included in undo/redo, LocalStorage, JSON, SVG export

**Acceptance criteria:**
- Door/window places on wall
- Follows wall angle
- Draggable along wall
- Properties editable
- Survives reload
- JSON/SVG/undo work

---

## 4. State Changes

### 4.1 New CanvasSettings fields
```ts
grid: GridSettings;
snap: SnapSettings;
```

### 4.2 New object types in FloorLayout
```ts
objects: (FloorObject | WallObject | DoorObject | WindowObject | DimensionAnnotation)[]
```

### 4.3 Schema migration
- Bump `schemaVersion` to 2
- On load: inject grid/snap defaults if missing
- Old wall shapes (legacy `type: 'wall'` FloorObjects) continue to render
- Missing fields on new types get defaults

---

## 5. Geometry Utilities

Add to `src/utils/geometry.ts`:
```ts
distance(a, b)
angleBetween(a, b)
projectPointToSegment(point, start, end)
clamp(value, min, max)
pointAlongSegment(start, end, offsetMm)
snapValue(value, spacing)
snapPoint(point, spacing)
formatDistance(mm)
```

---

## 6. UI Changes

**Toolbar additions:**
- Grid toggle + spacing dropdown
- Snap toggle
- Dimension tool
- Wall tool
- Door tool
- Window tool

**Properties panel additions:**
- Wall: length, thickness, start, end, angle
- Dimension: distance (read-only), start, end, name
- Door: width, swing direction, swing angle, attached wall
- Window: width, attached wall

---

## 7. Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Ctrl/Cmd+Z | Undo |
| Ctrl/Cmd+Y / Ctrl+Shift+Z | Redo |
| Esc | Cancel drawing tool |
| Delete/Backspace | Delete selected |
| Alt/Option (held) | Disable snap |
| Shift (held during wall draw) | Constrain angle to 45° |

---

## 8. Engineering Constraints

- No new large dependencies
- No `any`
- Follow existing code style and file structure
- All new logic in isolated, testable utility functions
- SVG rendering only (no canvas API)
- Static-site compatible

---

## 9. Testing

Run before and after: `npm test`, `npm run build`.

Key unit tests:
- geometry utilities (snapValue, formatDistance, projectPointToSegment, etc.)
- WallObject/DoorObject/WindowObject JSON round-trip
- DimensionAnnotation distance calculation
- Schema migration v1→v2

Manual checklist covers existing behavior (all Phase 1 features) plus all acceptance criteria in §3.

---

## 10. Implementation Order

1. Geometry utilities (`src/utils/geometry.ts`)
2. Grid state + SVG renderer
3. Snap state + snap helpers applied to existing interactions
4. Selected-object dimension labels
5. Dimension annotation model, renderer, draw interaction
6. Wall model, renderer, draw interaction, endpoint editing
7. Door/window model, renderers, placement interaction
8. Properties panel updates (wall, door, window, dimension)
9. Store + import/export + schema migration
10. Toolbar UI additions
11. Keyboard shortcut polish
12. Tests + manual pass
