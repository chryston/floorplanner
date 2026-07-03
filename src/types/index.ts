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

export interface CanvasSettings {
  image: FloorPlanImage | null
  pixelsPerMm: number | null
  grid: GridSettings
  snap: SnapSettings
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

export type ActiveTool = 'select' | 'dimension' | 'wall' | 'door' | 'window'

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

export interface FloorLayout {
  id: string
  name: string
  objects: AnyObject[]
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
