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
