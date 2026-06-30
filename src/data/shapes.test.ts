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
