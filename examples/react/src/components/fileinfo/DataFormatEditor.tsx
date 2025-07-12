import React, { useState } from 'react'
import { TouchstoneFormat, TouchstoneFormats } from 'rf-touchstone'

interface DataFormatEditorProps {
  currentFormat: TouchstoneFormat | undefined
  onFormatChange: (newFormat: TouchstoneFormat) => void
  disabled?: boolean
}

const DataFormatEditor: React.FC<DataFormatEditorProps> = ({
  currentFormat,
  onFormatChange,
  disabled,
}) => {
  const [localError, setLocalError] = useState<string | null>(null)

  const formatLabels: Record<TouchstoneFormat, string> = {
    RI: 'RI (Real/Imaginary)',
    MA: 'MA (Magnitude/Angle)',
    DB: 'DB (Decibel/Angle)',
  }

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setLocalError(null) // Clear previous error
    try {
      onFormatChange(event.target.value as TouchstoneFormat)
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <p>
      {currentFormat !== undefined ? (
        <select
          value={currentFormat || ''}
          onChange={handleChange}
          disabled={disabled}
          aria-label="Data Format Selector"
        >
          {TouchstoneFormats.map((formatValue) => (
            <option key={formatValue} value={formatValue}>
              {formatLabels[formatValue]}
            </option>
          ))}
        </select>
      ) : (
        'N/A'
      )}
      {localError && (
        <span style={{ color: 'red', marginLeft: '10px', fontSize: '0.9em' }}>
          Error: {localError}
        </span>
      )}
    </p>
  )
}

export default DataFormatEditor
