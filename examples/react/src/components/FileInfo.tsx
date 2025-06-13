import React from 'react'
import { Touchstone, FrequencyUnits } from 'rf-touchstone'

/**
 * Props for the FileInfo component.
 */
interface FileInfoProps {
  /** The loaded Touchstone data object, or null if no data is loaded. */
  touchstoneData: Touchstone | null
  /** The currently selected frequency unit (e.g., "GHz", "MHz"). */
  unit: string | undefined
  /** Callback function to handle changes to the frequency unit. */
  handleUnitChange: (newUnit: string) => void
  /** The currently selected data format (e.g., "RI", "MA", "DB"). */
  format: string | undefined
  /** Callback function to handle changes to the data format. */
  handleFormatChange: (newFormat: string) => void
}

/**
 * FileInfo component.
 * Displays metadata and user controls for a loaded Touchstone file,
 * allowing users to change frequency units and data formats.
 */
const FileInfo: React.FC<FileInfoProps> = ({
  touchstoneData,
  unit,
  handleUnitChange,
  format,
  handleFormatChange,
}) => {
  // If no Touchstone data is available, render nothing.
  if (!touchstoneData) {
    return null
  }

  return (
    <div>
      <h3>File Information</h3>

      {/* Display the number of ports in the Touchstone file. */}
      <p>
        <strong>Port number:</strong> {touchstoneData.nports}
      </p>

      {/* Frequency Unit Selector: Allows changing the unit for displayed frequencies. */}
      <p>
        <strong>Frequency Unit:</strong>{' '}
        {touchstoneData.frequency?.unit ? (
          <select
            value={unit || ''}
            onChange={(e) => handleUnitChange(e.target.value)}
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

      {/* Display the type of network parameter (e.g., S, Y, Z). */}
      <p>
        <strong>Parameter:</strong> {touchstoneData.parameter}
      </p>

      {/* Format Selector: Allows changing the format of displayed S-parameter data. */}
      <p>
        <strong>Format:</strong>{' '}
        {touchstoneData.format ? (
          <select
            value={format || ''}
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

      {/* Display the reference impedance for the S-parameters. */}
      <p>
        <strong>Impedance:</strong>{' '}
        {Array.isArray(touchstoneData.impedance)
          ? touchstoneData.impedance.join(', ')
          : touchstoneData.impedance}{' '}
        Ohms
      </p>

      {/* Display any comments found in the Touchstone file. */}
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
