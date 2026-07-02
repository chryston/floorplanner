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

