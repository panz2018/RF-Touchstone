import React from 'react';
import { TouchstoneFormat, TouchstoneFormats } from 'rf-touchstone'; // Assuming TouchstoneFormats is exported

interface DataFormatEditorProps {
  currentFormat: TouchstoneFormat | undefined;
  onFormatChange: (newFormat: TouchstoneFormat) => void;
  disabled?: boolean;
}

const DataFormatEditor: React.FC<DataFormatEditorProps> = ({ currentFormat, onFormatChange, disabled }) => {
  const formatLabels: Record<TouchstoneFormat, string> = {
    RI: 'RI (Real/Imaginary)',
    MA: 'MA (Magnitude/Angle)',
    DB: 'DB (Decibel/Angle)',
  };

  return (
    <p>
      <strong>Format:</strong>{' '}
      {currentFormat !== undefined ? (
        <select
          value={currentFormat || ''}
          onChange={(e) => onFormatChange(e.target.value as TouchstoneFormat)}
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
    </p>
  );
};

export default DataFormatEditor;
