import React, { useState } from 'react'

interface CommentsEditorProps {
  currentComments: string[]
  onCommentsChange: (newComments: string[]) => void
}

const CommentsEditor: React.FC<CommentsEditorProps> = ({
  currentComments,
  onCommentsChange,
}) => {
  const [localError, setLocalError] = useState<string | null>(null)

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalError(null) // Clear previous error
    try {
      onCommentsChange(event.target.value.split('\n'))
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div>
      <textarea
        value={currentComments.join('\n')}
        onChange={handleTextChange}
        rows={Math.max(3, currentComments.length)}
        style={{
          width: '100%',
          marginTop: '5px',
          padding: '5px',
          boxSizing: 'border-box',
        }}
        placeholder="Enter comments here, one per line."
        aria-label="Editable Comments"
      />
      {localError && (
        <div style={{ color: 'red', marginTop: '5px', fontSize: '0.9em' }}>
          Error: {localError}
        </div>
      )}
    </div>
  )
}

export default CommentsEditor
