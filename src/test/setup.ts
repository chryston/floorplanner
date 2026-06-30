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
