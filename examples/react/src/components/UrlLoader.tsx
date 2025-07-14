import React, { useState, useRef, useEffect } from 'react'

interface UrlLoaderProps {
  loadUrl: (url: string) => void
}

/**
 * UrlLoader component.
 * Provides UI for users to input a URL for a Touchstone file and submit it for loading.
 * Includes an "Open from URL" button that toggles a text input and a "Load URL" button.
 * Handles basic URL validation (non-empty, valid format).
 */
const UrlLoader: React.FC<UrlLoaderProps> = ({ loadUrl }) => {
  const [url, setUrl] = useState<string>('')
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const urlInputRef = useRef<HTMLTextAreaElement | null>(null)

  const openDialog = () => {
    setIsDialogOpen(true)
    setError(null) // Clear error when toggling
    setUrl('') // Clear URL when opening modal
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
  }

  useEffect(() => {
    if (isDialogOpen && urlInputRef.current) {
      urlInputRef.current.focus()
    }
  }, [isDialogOpen])

  const handleSubmit = () => {
    if (!url.trim()) {
      setError('URL cannot be empty.')
      return
    }
    // Basic URL validation (can be improved)
    try {
      new URL(url) // Check if the URL is valid
    } catch (_) {
      setError('Invalid URL format.')
      return
    }
    setError(null) // Clear error before submitting
    loadUrl(url)
  }

  const submitURL = () => {
    handleSubmit() // This will update the error state
    if (!error) {
      // If handleSubmit cleared the error, it means validation passed
      loadUrl(url)
      setIsDialogOpen(false) // Close modal on successful submit
    }
  }

  return (
    <div>
      <button className="prime-button" onClick={openDialog}>
        Load from URL
      </button>

      {isDialogOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent overlay
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000, // Ensure modal is on top
          }}
          // Add onClick handler to close dialog when clicking outside
          onClick={closeDialog}
        >
          <div
            // Stop propagation so clicks inside the dialog don't close it
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#fff',
              padding: '20px',
              borderRadius: '8px',
              position: 'relative',
              height: 'auto' /* Allow height to adjust based on content */,
              width: 'auto',
              maxWidth: '90%',
            }}
          >
            <button
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: '2em',
              }}
              onClick={closeDialog}
            >
              &times;
            </button>
            <h2>Load Touchstone File from URL</h2>
            <textarea
              ref={urlInputRef}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter Touchstone file URL"
              rows={1}
              style={{
                width: '100%',
                padding: '10px', // Increased padding
                boxSizing: 'border-box',
                maxHeight: '200px' /* Constrain max height */,
                overflowY:
                  'auto' /* Add scrollbar when content exceeds max height */,
                fontFamily: 'inherit', // Use inherited font
                fontSize: 'inherit', // Use inherited font size
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            />
            {error && (
              <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>
            )}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: '20px',
              }}
            >
              <button onClick={closeDialog} style={{ marginRight: '10px' }}>
                Cancel
              </button>
              <button onClick={submitURL}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UrlLoader
