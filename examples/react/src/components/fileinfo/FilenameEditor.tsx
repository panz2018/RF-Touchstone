import React, { useState, useEffect } from 'react'

interface FilenameEditorProps {
  currentFilename: string
  onFilenameChange: (_newFilename: string) => void
}

const FilenameEditor: React.FC<FilenameEditorProps> = ({
  currentFilename,
  onFilenameChange,
}) => {
  const getBaseName = (name: string): string =>
    name.substring(0, name.lastIndexOf('.')) || name
  const getExtension = (name: string): string =>
    name.substring(name.lastIndexOf('.'))

  const [editableBaseName, setEditableBaseName] = useState<string>(
    getBaseName(currentFilename)
  )
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    setEditableBaseName(getBaseName(currentFilename))
    setLocalError(null) // Clear error when filename prop changes
  }, [currentFilename])

  const handleBaseNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEditableBaseName(event.target.value)
    if (localError) setLocalError(null) // Clear error on new input
  }

  const submitChange = () => {
    setLocalError(null)
    const trimmedBaseName = editableBaseName.trim()
    if (trimmedBaseName === '') {
      setLocalError('Filename base cannot be empty.')
      setEditableBaseName(getBaseName(currentFilename)) // Revert
      return
    }

    const newFilename = trimmedBaseName + getExtension(currentFilename)
    if (newFilename !== currentFilename) {
      try {
        onFilenameChange(newFilename)
      } catch (err) {
        setLocalError(err instanceof Error ? err.message : String(err))
      }
    }
  }

  const handleBaseNameBlur = () => {
    // Only submit if it's different from original to avoid unnecessary calls if user just clicks away
    if (editableBaseName !== getBaseName(currentFilename)) {
      submitChange()
    }
  }

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      submitChange()
      ;(event.target as HTMLInputElement).blur()
    }
  }

  return (
    <>
      <input
        type="text"
        value={editableBaseName}
        onChange={handleBaseNameChange}
        onBlur={handleBaseNameBlur}
        onKeyPress={handleKeyPress}
        style={{ marginLeft: '0px', padding: '0px', width: '300px' }}
        aria-label="Editable Filename Base"
      />
      <span>{getExtension(currentFilename)}</span>
      {localError && (
        <span style={{ color: 'red', marginLeft: '10px', fontSize: '0.9em' }}>
          Error: {localError}
        </span>
      )}
    </>
  )
}

export default FilenameEditor
