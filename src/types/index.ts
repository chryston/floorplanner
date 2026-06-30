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
