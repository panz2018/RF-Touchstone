import React, { useState } from 'react'
import { FrequencyUnits, type FrequencyUnit } from 'rf-touchstone'

interface FrequencyUnitEditorProps {
  currentUnit: FrequencyUnit | undefined
  onUnitChange: (newUnit: FrequencyUnit) => void
  disabled?: boolean
}

const FrequencyUnitEditor: React.FC<FrequencyUnitEditorProps> = ({
  currentUnit,
  onUnitChange,
  disabled,
}) => {
  const [localError, setLocalError] = useState<string | null>(null)

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setLocalError(null) // Clear previous error
    try {
      onUnitChange(event.target.value as FrequencyUnit)
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <p>
      {currentUnit !== undefined ? (
        <select
          value={currentUnit || ''}
          onChange={handleChange}
          disabled={disabled}
          aria-label="Frequency Unit Selector"
        >
          {FrequencyUnits.map((u) => (
            <option key={u} value={u}>
              {u}
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

export default FrequencyUnitEditor
