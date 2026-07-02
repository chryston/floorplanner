import { describe, it, expect } from 'vitest'
import React from 'react'
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
    const el = renderShape(makeObj({ shapeType: 'rectangle', width: 100, depth: 50 })) as React.ReactElement<Record<string, unknown>>
    expect(el.type).toBe('rect')
    expect(el.props.width).toBe(100)
    expect(el.props.height).toBe(50)
  })

  it('square returns rect element', () => {
    const el = renderShape(makeObj({ shapeType: 'square', width: 150, depth: 150 })) as React.ReactElement<Record<string, unknown>>
    expect(el.type).toBe('rect')
    expect(el.props.width).toBe(150)
    expect(el.props.height).toBe(150)
  })

  it('circle returns circle element with correct radius', () => {
    const el = renderShape(makeObj({ shapeType: 'circle', width: 120, depth: 120 })) as React.ReactElement<Record<string, unknown>>
    expect(el.type).toBe('circle')
    expect(el.props.r).toBe(60) // half of width
  })

  it('ellipse returns ellipse element', () => {
    const el = renderShape(makeObj({ shapeType: 'ellipse', width: 200, depth: 100 })) as React.ReactElement<Record<string, unknown>>
    expect(el.type).toBe('ellipse')
    expect(el.props.rx).toBe(100)
    expect(el.props.ry).toBe(50)
  })

  it('triangle returns polygon with 3 points', () => {
    const el = renderShape(makeObj({ shapeType: 'triangle', width: 100, depth: 100 })) as React.ReactElement<Record<string, unknown>>
    expect(el.type).toBe('polygon')
    const points: string = el.props.points as string
    expect(points.trim().split(' ')).toHaveLength(3)
  })

  it('right-triangle returns polygon with 3 points', () => {
    const el = renderShape(makeObj({ shapeType: 'right-triangle', width: 100, depth: 100 })) as React.ReactElement<Record<string, unknown>>
    expect(el.type).toBe('polygon')
    const points: string = el.props.points as string
    expect(points.trim().split(' ')).toHaveLength(3)
  })

  it('wall returns line element', () => {
    const el = renderShape(makeObj({ shapeType: 'wall', width: 200, depth: 10 })) as React.ReactElement<Record<string, unknown>>
    expect(el.type).toBe('line')
  })

  it('hexagon returns polygon with 6 points', () => {
    const el = renderShape(makeObj({ shapeType: 'hexagon', width: 150, depth: 150 })) as React.ReactElement<Record<string, unknown>>
    expect(el.type).toBe('polygon')
    const points: string = el.props.points as string
    expect(points.trim().split(' ')).toHaveLength(6)
  })

  it('pentagon returns polygon with 5 points', () => {
    const el = renderShape(makeObj({ shapeType: 'pentagon', width: 150, depth: 150 })) as React.ReactElement<Record<string, unknown>>
    expect(el.type).toBe('polygon')
    const points: string = el.props.points as string
    expect(points.trim().split(' ')).toHaveLength(5)
  })

  it('octagon returns polygon with 8 points', () => {
    const el = renderShape(makeObj({ shapeType: 'octagon', width: 150, depth: 150 })) as React.ReactElement<Record<string, unknown>>
    expect(el.type).toBe('polygon')
    const points: string = el.props.points as string
    expect(points.trim().split(' ')).toHaveLength(8)
  })

  it('fill and stroke props are passed through', () => {
    const el = renderShape(makeObj({ fill: '#red', stroke: '#blue' })) as React.ReactElement<Record<string, unknown>>
    expect(el.props.fill).toBe('#red')
    expect(el.props.stroke).toBe('#blue')
  })

  it('semicircle returns path element', () => {
    const el = renderShape(makeObj({ shapeType: 'semicircle', width: 150, depth: 75 })) as React.ReactElement<Record<string, unknown>>
    expect(el.type).toBe('path')
  })

  it('quadrant returns path element', () => {
    const el = renderShape(makeObj({ shapeType: 'quadrant', width: 150, depth: 150 })) as React.ReactElement<Record<string, unknown>>
    expect(el.type).toBe('path')
  })

  it('L-shape returns polygon with 6 points', () => {
    const el = renderShape(makeObj({ shapeType: 'L-shape', width: 200, depth: 200 }))
    expect(el.type).toBe('polygon')
    const points: string = (el as React.ReactElement<Record<string, unknown>>).props.points as string
    expect(points.trim().split(' ')).toHaveLength(6)
  })

  it('U-shape returns polygon with 8 points', () => {
    const el = renderShape(makeObj({ shapeType: 'U-shape', width: 200, depth: 200 }))
    expect(el.type).toBe('polygon')
    const points: string = (el as React.ReactElement<Record<string, unknown>>).props.points as string
    expect(points.trim().split(' ')).toHaveLength(8)
  })
})
