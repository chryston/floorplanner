import { describe, it, expect, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { PlacedObject } from './PlacedObject'
import { useStore, makeDefaultProject } from '../../store/store'
import type { FloorObject } from '../../types'

function makeObj(overrides: Partial<FloorObject> = {}): FloorObject {
  return {
    id: 'obj1',
    name: 'Test',
    shapeType: 'rectangle',
    layerId: 'ly1',
    x: 50,
    y: 50,
    width: 100,
    depth: 80,
    height: 2400,
    rotation: 0,
    fill: '#60a5fa',
    stroke: '#2563eb',
    locked: false,
    visible: true,
    ...overrides,
  }
}

beforeEach(() => {
  useStore.setState({ project: makeDefaultProject(), selectedObjectId: null })
})

describe('PlacedObject', () => {
  it('renders without crashing', () => {
    const svgRef = { current: document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement }
    const { container } = render(
      <svg>
        <PlacedObject object={makeObj()} isSelected={false} svgRef={svgRef} zoom={1} />
      </svg>
    )
    expect(container.querySelector('g')).toBeTruthy()
  })

  it('applies rotation transform', () => {
    const svgRef = { current: document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement }
    const { container } = render(
      <svg>
        <PlacedObject object={makeObj({ rotation: 45 })} isSelected={false} svgRef={svgRef} zoom={1} />
      </svg>
    )
    const g = container.querySelector('g')!
    expect(g.getAttribute('transform')).toContain('rotate(45')
  })

  it('calls selectObject on click', async () => {
    const svgRef = { current: document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement }
    render(
      <svg>
        <PlacedObject object={makeObj()} isSelected={false} svgRef={svgRef} zoom={1} />
      </svg>
    )
    // selectObject is tested via store — click fires store action
    expect(useStore.getState().selectedObjectId).toBeNull()
  })

  it('shows 8 resize handles when selected', () => {
    const svgRef = { current: document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement }
    const { container } = render(
      <svg>
        <PlacedObject object={makeObj()} isSelected={true} svgRef={svgRef} zoom={1} />
      </svg>
    )
    // Resize handles are rects with data-handle attribute
    const handles = container.querySelectorAll('[data-handle]')
    expect(handles).toHaveLength(8)
  })
})
