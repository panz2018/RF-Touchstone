import React from 'react'
import { Touchstone } from 'rf-touchstone'

interface DownloadButtonProps {
  touchstone: Touchstone | null
  filename: string // Current filename, potentially edited
}

/**
 * DownloadButton component.
 * Provides a button to download the content of the loaded Touchstone file.
 * Uses the provided filename, which may have been edited by the user.
 */
const DownloadButton: React.FC<DownloadButtonProps> = ({
  touchstone,
  filename,
}) => {
  const handleDownloadFile = () => {
    if (!touchstone) {
      console.warn('No data to download.')
      return
    }
    try {
      // Similar to CopyButton, if edited comments should be part of the downloaded file,
      // the Touchstone object itself needs to be updated with those comments in the parent component,
      // or this component needs to receive the comments array separately.
      // Assuming for now that `touchstone.toString()` uses the *original* comments from the loaded file,
      // unless `TouchstoneViewer` updates the `touchstone` object itself upon comment changes.
      // This is a point of potential refinement: if edited comments should be downloaded,
      // the `touchstone` object prop must reflect those changes.

      const fileContentString = touchstone.toString()
      const blob = new Blob([fileContentString], {
        type: 'text/plain;charset=utf-8',
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      // Use the filename prop, which may have been edited by the user
      link.download = filename || `data.s${touchstone.nports || ''}p`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to download file:', err)
      // Optionally, add user-facing error feedback here if needed
    }
  }

  return (
    <button
      onClick={handleDownloadFile}
      disabled={!touchstone}
      className="prime-button"
    >
      Download
    </button>
  )
}

export default DownloadButton
