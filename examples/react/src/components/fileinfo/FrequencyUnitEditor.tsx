import React from 'react';
import { FrequencyUnits, type FrequencyUnit } from 'rf-touchstone';

interface FrequencyUnitEditorProps {
  currentUnit: FrequencyUnit | undefined;
  onUnitChange: (newUnit: FrequencyUnit) => void;
  disabled?: boolean;
}

const FrequencyUnitEditor: React.FC<FrequencyUnitEditorProps> = ({ currentUnit, onUnitChange, disabled }) => {
  return (
    <p>
      <strong>Frequency Unit:</strong>{' '}
      {currentUnit !== undefined ? (
        <select
          value={currentUnit || ''}
          onChange={(e) => onUnitChange(e.target.value as FrequencyUnit)}
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
    </p>
  );
};

export default FrequencyUnitEditor;
