import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import UrlLoader from '../src/components/UrlLoader'

describe('UrlLoader Component', () => {
  const mockOnUrlSubmit = vi.fn()

  beforeEach(() => {
    // Reset mocks before each test
    mockOnUrlSubmit.mockClear()
  })

  test('renders "Open from URL" button initially', () => {
    render(<UrlLoader loadUrl={mockOnUrlSubmit} />)
    expect(
      screen.getByRole('button', { name: /Open from URL/i })
    ).toBeInTheDocument()
  })

  test('shows URL input and "Load URL" button when "Open from URL" is clicked', () => {
    render(<UrlLoader loadUrl={mockOnUrlSubmit} />)
    const openButton = screen.getByRole('button', { name: /Open from URL/i })
    fireEvent.click(openButton)

    expect(
      screen.getByPlaceholderText(/Enter Touchstone file URL/i)
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Load URL/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Cancel URL Load/i })
    ).toBeInTheDocument() // Button text changes
  })

  test('hides URL input and "Load URL" button when "Cancel URL Load" is clicked', () => {
    render(<UrlLoader loadUrl={mockOnUrlSubmit} />)
    const openButton = screen.getByRole('button', { name: /Open from URL/i })
    fireEvent.click(openButton) // Show inputs

    const cancelButton = screen.getByRole('button', {
      name: /Cancel URL Load/i,
    })
    fireEvent.click(cancelButton) // Hide inputs

    expect(
      screen.queryByPlaceholderText(/Enter Touchstone file URL/i)
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /Load URL/i })
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Open from URL/i })
    ).toBeInTheDocument() // Button text reverts
  })

  test('updates URL input value on change', () => {
    render(<UrlLoader loadUrl={mockOnUrlSubmit} />)
    fireEvent.click(screen.getByRole('button', { name: /Open from URL/i }))

    const urlInput = screen.getByPlaceholderText(
      /Enter Touchstone file URL/i
    ) as HTMLInputElement
    fireEvent.change(urlInput, {
      target: { value: 'http://example.com/test.s2p' },
    })
    expect(urlInput.value).toBe('http://example.com/test.s2p')
  })

  test('calls onUrlSubmit with the URL when "Load URL" is clicked with a valid URL', () => {
    render(<UrlLoader loadUrl={mockOnUrlSubmit} />)
    fireEvent.click(screen.getByRole('button', { name: /Open from URL/i }))

    const urlInput = screen.getByPlaceholderText(/Enter Touchstone file URL/i)
    fireEvent.change(urlInput, {
      target: { value: 'https://example.com/data.s2p' },
    })

    const loadButton = screen.getByRole('button', { name: /Load URL/i })
    fireEvent.click(loadButton)

    expect(mockOnUrlSubmit).toHaveBeenCalledTimes(1)
    expect(mockOnUrlSubmit).toHaveBeenCalledWith('https://example.com/data.s2p')
  })

  test('shows error if URL is empty when "Load URL" is clicked', () => {
    render(<UrlLoader loadUrl={mockOnUrlSubmit} />)
    fireEvent.click(screen.getByRole('button', { name: /Open from URL/i }))

    const loadButton = screen.getByRole('button', { name: /Load URL/i })
    fireEvent.click(loadButton)

    expect(screen.getByText('URL cannot be empty.')).toBeInTheDocument()
    expect(mockOnUrlSubmit).not.toHaveBeenCalled()
  })

  test('shows error if URL is invalid when "Load URL" is clicked', () => {
    render(<UrlLoader loadUrl={mockOnUrlSubmit} />)
    fireEvent.click(screen.getByRole('button', { name: /Open from URL/i }))

    const urlInput = screen.getByPlaceholderText(/Enter Touchstone file URL/i)
    fireEvent.change(urlInput, { target: { value: 'not-a-valid-url' } })

    const loadButton = screen.getByRole('button', { name: /Load URL/i })
    fireEvent.click(loadButton)

    expect(screen.getByText('Invalid URL format.')).toBeInTheDocument()
    expect(mockOnUrlSubmit).not.toHaveBeenCalled()
  })

  test('clears error message when input changes after an error was shown', () => {
    render(<UrlLoader loadUrl={mockOnUrlSubmit} />)
    fireEvent.click(screen.getByRole('button', { name: /Open from URL/i }))

    const loadButton = screen.getByRole('button', { name: /Load URL/i })
    fireEvent.click(loadButton) // Trigger empty URL error
    expect(screen.getByText('URL cannot be empty.')).toBeInTheDocument()

    const urlInput = screen.getByPlaceholderText(/Enter Touchstone file URL/i)
    fireEvent.change(urlInput, { target: { value: 'h' } }) // Start typing
    expect(screen.queryByText('URL cannot be empty.')).not.toBeInTheDocument()
  })

  test('clears URL and error when "Cancel URL Load" is clicked after an error', () => {
    render(<UrlLoader loadUrl={mockOnUrlSubmit} />)
    const openButton = screen.getByRole('button', { name: /Open from URL/i })
    fireEvent.click(openButton) // Show inputs

    const urlInput = screen.getByPlaceholderText(
      /Enter Touchstone file URL/i
    ) as HTMLInputElement
    fireEvent.change(urlInput, { target: { value: 'invalid-url' } })

    const loadButton = screen.getByRole('button', { name: /Load URL/i })
    fireEvent.click(loadButton) // Trigger invalid URL error
    expect(screen.getByText('Invalid URL format.')).toBeInTheDocument()
    expect(urlInput.value).toBe('invalid-url')

    const cancelButton = screen.getByRole('button', {
      name: /Cancel URL Load/i,
    })
    fireEvent.click(cancelButton) // Hide inputs

    expect(screen.queryByText('Invalid URL format.')).not.toBeInTheDocument()
    // After cancellation, if we open it again, the input should be clear
    fireEvent.click(screen.getByRole('button', { name: /Open from URL/i }))
    const freshUrlInput = screen.getByPlaceholderText(
      /Enter Touchstone file URL/i
    ) as HTMLInputElement
    expect(freshUrlInput.value).toBe('')
  })
})
