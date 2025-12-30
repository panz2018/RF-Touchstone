import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { describe, it, expect, vi } from 'vitest'
import CommentsEditor from '../../../src/components/fileinfo/CommentsEditor'

describe('CommentsEditor Component', () => {
  const mockOnCommentsChange = vi.fn()

  it('renders with initial comments and calls onCommentsChange', () => {
    mockOnCommentsChange.mockClear()
    const initialComments = ['Comment 1', 'Line 2']
    render(
      <CommentsEditor
        currentComments={initialComments}
        onCommentsChange={mockOnCommentsChange}
      />
    )
    const textarea = screen.getByLabelText(
      'Editable Comments'
    ) as HTMLTextAreaElement
    expect(textarea.value).toBe('Comment 1\nLine 2')

    fireEvent.change(textarea, {
      target: { value: 'New comment\nAnother line' },
    })
    expect(mockOnCommentsChange).toHaveBeenCalledWith([
      'New comment',
      'Another line',
    ])
    expect(screen.queryByText(/Error:/)).not.toBeInTheDocument()
  })

  it('displays error when onCommentsChange throws', () => {
    mockOnCommentsChange.mockClear()
    const errMsg = 'Parent error on comments change'
    mockOnCommentsChange.mockImplementation(() => {
      throw new Error(errMsg)
    })
    const initialComments = ['Comment 1']
    render(
      <CommentsEditor
        currentComments={initialComments}
        onCommentsChange={mockOnCommentsChange}
      />
    )
    const textarea = screen.getByLabelText('Editable Comments')
    fireEvent.change(textarea, { target: { value: 'New comment' } })
    expect(screen.getByText(`Error: ${errMsg}`)).toBeInTheDocument()
  })
})
