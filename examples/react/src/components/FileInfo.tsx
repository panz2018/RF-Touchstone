import React from 'react'
import { Touchstone, FrequencyUnits } from 'rf-touchstone'

interface FileInfoProps {
  touchstoneData: Touchstone | null
  selectedFrequencyUnit: string | undefined
  handleFrequencyUnitChange: (newUnit: string) => void
  selectedFormat: string | undefined
  handleFormatChange: (newFormat: string) => void
}

const FileInfo: React.FC<FileInfoProps> = ({
  touchstoneData,
  selectedFrequencyUnit,
  handleFrequencyUnitChange,
  selectedFormat,
  handleFormatChange,
}) => {
  if (!touchstoneData) {
    return null
  }

  return (
    <div>
      <h3>File Information</h3>
      <p>
        <strong>Port number:</strong> {touchstoneData.nports}
      </p>
      <p>
        <strong>Frequency Unit:</strong>{' '}
        {touchstoneData.frequency?.unit ? (
          <select
            value={selectedFrequencyUnit || ''}
            onChange={(e) => handleFrequencyUnitChange(e.target.value)}
          >
            {FrequencyUnits.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        ) : (
          'N/A'
        )}
      </p>
      <p>
        <strong>Parameter:</strong> {touchstoneData.parameter}
      </p>
      <p>
        <strong>Format:</strong>{' '}
        {touchstoneData.format ? (
          <select
            value={selectedFormat || ''}
            onChange={(e) => handleFormatChange(e.target.value)}
          >
            <option value="RI">RI (Real/Imaginary)</option>
            <option value="MA">MA (Magnitude/Angle)</option>
            <option value="DB">DB (Decibel/Angle)</option>
          </select>
        ) : (
          'N/A'
        )}
      </p>
      <p>
        <strong>Impedance:</strong>{' '}
        {Array.isArray(touchstoneData.impedance)
          ? touchstoneData.impedance.join(', ')
          : touchstoneData.impedance}{' '}
        Ohms
      </p>
      {touchstoneData.comments.length > 0 && (
        <div>
          <strong>Comments:</strong>
          <ul>
            {touchstoneData.comments.map((comment, index) => (
              <li key={index}>{comment}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default FileInfo
