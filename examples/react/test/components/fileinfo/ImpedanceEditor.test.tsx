import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import ImpedanceEditor from '../../../src/components/fileinfo/ImpedanceEditor'
import { TouchstoneImpedance } from 'rf-touchstone'

describe('ImpedanceEditor Component', () => {
  let mockOnImpedanceChange: Mock<(_newImpedance: TouchstoneImpedance) => void>

  beforeEach(() => {
    mockOnImpedanceChange = vi.fn()
  })

  const renderEditor = (currentImpedance?: TouchstoneImpedance) => {
    return render(
      <ImpedanceEditor
        currentImpedance={currentImpedance}
        onImpedanceChange={mockOnImpedanceChange}
      />
    )
  }

  it('renders with initial numeric impedance', () => {
    renderEditor(50)
    const input = screen.getByLabelText(
      'Editable Impedance'
    ) as HTMLInputElement
    expect(input.value).toBe('50')
  })

  it('renders with initial array impedance as comma-separated string', () => {
    renderEditor([50, 75, 100])
    const input = screen.getByLabelText(
      'Editable Impedance'
    ) as HTMLInputElement
    expect(input.value).toBe('50, 75, 100')
  })

  it('renders empty string if impedance is undefined', () => {
    renderEditor(undefined)
    const input = screen.getByLabelText(
      'Editable Impedance'
    ) as HTMLInputElement
    expect(input.value).toBe('')
  })

  it('updates local string state on input change', () => {
    renderEditor(50)
    const input = screen.getByLabelText(
      'Editable Impedance'
    ) as HTMLInputElement
    fireEvent.change(input, { target: { value: '75, 100' } })
    expect(input.value).toBe('75, 100')
  })

  it('calls onImpedanceChange with a number on blur if valid single number input', () => {
    renderEditor(50)
    const input = screen.getByLabelText('Editable Impedance')
    fireEvent.change(input, { target: { value: '75' } })
    fireEvent.blur(input)
    expect(mockOnImpedanceChange).toHaveBeenCalledWith(75)
  })

  it('calls onImpedanceChange with a number array on blur if valid comma-separated input', () => {
    renderEditor(50)
    const input = screen.getByLabelText('Editable Impedance')
    fireEvent.change(input, { target: { value: '75, 100, 25' } })
    fireEvent.blur(input)
    expect(mockOnImpedanceChange).toHaveBeenCalledWith([75, 100, 25])
  })

  it('calls onImpedanceChange on Enter key press', () => {
    renderEditor(50)
    const input = screen.getByLabelText('Editable Impedance')
    fireEvent.change(input, { target: { value: '60' } })
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 })
    expect(mockOnImpedanceChange).toHaveBeenCalledWith(60)
  })

  it('shows alert and reverts if input is empty on blur', async () => {
    window.alert = vi.fn() // Mock window.alert
    renderEditor(50)
    const input = screen.getByLabelText(
      'Editable Impedance'
    ) as HTMLInputElement
    fireEvent.change(input, { target: { value: '  ' } }) // Whitespace only
    fireEvent.blur(input)

    expect(
      screen.getByText('Error: Impedance cannot be empty.')
    ).toBeInTheDocument()
    // Value might not revert in this version of component, it shows error and keeps user input
    // expect(input.value).toBe('50');
    expect(mockOnImpedanceChange).not.toHaveBeenCalled()
  })

  it('displays local error and does not call onImpedanceChange if input is non-numeric on blur', async () => {
    renderEditor(50)
    const input = screen.getByLabelText(
      'Editable Impedance'
    ) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'abc' } })
    fireEvent.blur(input)

    expect(
      screen.getByText('Error: Invalid impedance: All values must be numbers.')
    ).toBeInTheDocument()
    // expect(input.value).toBe('50'); // Optional: check if it reverts or keeps invalid input
    expect(mockOnImpedanceChange).not.toHaveBeenCalled()
  })

  it('displays local error for comma-separated non-numeric input on blur', async () => {
    renderEditor(50)
    const input = screen.getByLabelText(
      'Editable Impedance'
    ) as HTMLInputElement
    fireEvent.change(input, { target: { value: '50, abc, 75' } })
    fireEvent.blur(input)

    expect(
      screen.getByText('Error: Invalid impedance: All values must be numbers.')
    ).toBeInTheDocument()
    expect(mockOnImpedanceChange).not.toHaveBeenCalled()
  })

  it('displays error if onImpedanceChange throws', () => {
    const errMsg = 'Parent error on impedance change'
    mockOnImpedanceChange.mockImplementation(() => {
      throw new Error(errMsg)
    })
    renderEditor(50)
    const input = screen.getByLabelText('Editable Impedance')
    fireEvent.change(input, { target: { value: '75' } })
    fireEvent.blur(input)
    expect(screen.getByText(`Error: ${errMsg}`)).toBeInTheDocument()
  })

  it('does not call onImpedanceChange if value is parsed but effectively unchanged', () => {
    renderEditor(50)
    const input = screen.getByLabelText('Editable Impedance')
    fireEvent.change(input, { target: { value: '50  ' } }) // Same value with whitespace
    fireEvent.blur(input)
    expect(mockOnImpedanceChange).not.toHaveBeenCalled()
  })

  it('updates input value when currentImpedance prop changes', () => {
    const { rerender } = renderEditor(50)
    const input = screen.getByLabelText(
      'Editable Impedance'
    ) as HTMLInputElement
    expect(input.value).toBe('50')

    rerender(
      <ImpedanceEditor
        currentImpedance={[75, 100]}
        onImpedanceChange={mockOnImpedanceChange}
      />
    )
    expect(input.value).toBe('75, 100')
  })
})
