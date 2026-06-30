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
