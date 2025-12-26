import React, { useState } from 'react'
import { Touchstone } from 'rf-touchstone'

interface CopyButtonProps {
  touchstone: Touchstone | null
}

/**
 * CopyButton component.
 * Provides a button to copy the content of the loaded Touchstone file to the clipboard.
 * Manages its own status messages for the copy operation.
 */
const CopyButton: React.FC<CopyButtonProps> = ({ touchstone }) => {
  const [copyStatus, setCopyStatus] = useState<string>('')

  const handleCopyData = async () => {
    if (!touchstone) {
      setCopyStatus('No data to copy to clipboard.')
      setTimeout(() => setCopyStatus(''), 3000)
      return
    }
    try {
      // Note: If comments are edited in FileInfo and should be part of the copied string,
      // the Touchstone object itself needs to be updated with those comments *before* being passed here,
      // or this component needs to receive the comments array separately and reconstruct the string.
      // For now, assuming touchstone.toString() is sufficient as per original logic.
      // If editableComments need to be reflected in the copied string, the Touchstone object
      // passed as a prop should have its comments property updated in the parent component (TouchstoneViewer)
      // before this handleCopyData is called, or this component needs to be aware of editableComments.
      // Current plan: TouchstoneViewer will manage updating the touchstone object with new comments if needed.
      // For now, the user wants to edit comments in the UI, but the plan doesn't specify if these edits
      // should persist back into the Touchstone object for copy/download.
      // Let's assume for now that `touchstone.toString()` uses the *original* comments from the loaded file,
      // unless `TouchstoneViewer` updates the `touchstone` object itself upon comment changes.
      // This is a point of potential refinement: if edited comments should be copied,
      // the `touchstone` object prop must reflect those changes.

      const fileContentString = touchstone.toString()
      await navigator.clipboard.writeText(fileContentString)
      setCopyStatus('Copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy data:', err)
      setCopyStatus('Failed to copy.')
    } finally {
      setTimeout(() => setCopyStatus(''), 3000)
    }
  }

  return (
    <>
      <button
        className="prime-button"
        onClick={handleCopyData}
        disabled={!touchstone}
      >
        Copy Data
      </button>
      {copyStatus && <span style={{ marginLeft: '10px' }}>{copyStatus}</span>}
    </>
  )
}

export default CopyButton
