import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PropertiesPanel } from './PropertiesPanel'
import { useStore, makeDefaultProject } from '../../store/store'

beforeEach(() => {
  useStore.setState({ project: makeDefaultProject(), selectedObjectId: null })
})

describe('PropertiesPanel', () => {
  it('shows placeholder when no object selected', () => {
    render(<PropertiesPanel />)
    expect(screen.getByText(/select an object/i)).toBeInTheDocument()
  })

  it('shows object name when an object is selected', () => {
    useStore.getState().addObject('rectangle')
    const obj = useStore.getState().project.layouts[0].objects[0]
    useStore.setState({ selectedObjectId: obj.id })
    render(<PropertiesPanel />)
    expect(screen.getByDisplayValue(obj.name)).toBeInTheDocument()
  })

  it('updates object name on input change', async () => {
    const user = userEvent.setup()
    useStore.getState().addObject('square')
    const obj = useStore.getState().project.layouts[0].objects[0]
    useStore.setState({ selectedObjectId: obj.id })
    render(<PropertiesPanel />)
    const input = screen.getByDisplayValue(obj.name)
    await user.clear(input)
    await user.type(input, 'Dining Table')
    expect(useStore.getState().project.layouts[0].objects[0].name).toBe('Dining Table')
  })

  it('shows rotation field with current value', () => {
    useStore.getState().addObject('rectangle')
    const obj = useStore.getState().project.layouts[0].objects[0]
    useStore.setState({ selectedObjectId: obj.id })
    render(<PropertiesPanel />)
    expect(screen.getByDisplayValue('0')).toBeInTheDocument()
  })

  it('shows height and memo fields', () => {
    useStore.getState().addObject('circle')
    const obj = useStore.getState().project.layouts[0].objects[0]
    useStore.setState({ selectedObjectId: obj.id })
    render(<PropertiesPanel />)
    expect(screen.getByLabelText(/height/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/memo/i)).toBeInTheDocument()
  })
})
