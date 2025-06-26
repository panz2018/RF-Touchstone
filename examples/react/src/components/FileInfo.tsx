import React from 'react'
import { Touchstone, FrequencyUnits, type FrequencyUnit, type TouchstoneFormat } from 'rf-touchstone'

/**
 * Props for the FileInfo component.
 */
interface FileInfoProps {
  /** The loaded Touchstone data object, or null if no data is loaded. */
  touchstone: Touchstone | null
  /** Callback function to set the new frequency unit. */
  setUnit: (unit: FrequencyUnit) => void
  /** Callback function to set the new data format. */
  setFormat: (format: TouchstoneFormat) => void
  /** The current filename. */
  filename: string // Filename state is still managed separately in parent
  /** Callback function to update the filename in the parent component. */
  setFilename: (newName: string) => void
  /** Callback function to set the new comments. */
  setComments: (comments: string[]) => void
}

/**
 * FileInfo component.
 * Displays metadata from the Touchstone object and provides controls for user interactions
 * such as changing frequency units, data formats, filename, and comments.
 * Unit, format, and comments data are sourced directly from the `touchstone` prop.
 * Calls provided setter functions to update parent state.
 */
const FileInfo: React.FC<FileInfoProps> = ({
  touchstone,
  setUnit,
  setFormat,
  filename,
  setFilename, // Updated prop name
  setComments,
}) => {
  // If no Touchstone data is available, render nothing.
  if (!touchstone) {
    return null
  }

  const getBaseName = (name: string): string => name.substring(0, name.lastIndexOf('.')) || name;
  const getExtension = (name: string): string => name.substring(name.lastIndexOf('.'));

  const [editableBaseName, setEditableBaseName] = React.useState<string>(getBaseName(filename));

  React.useEffect(() => {
    setEditableBaseName(getBaseName(filename));
  }, [filename]);

  const onBaseNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEditableBaseName(event.target.value);
  };

  const onBaseNameBlur = () => {
    const newFilename = editableBaseName + getExtension(filename);
    if (newFilename !== filename && editableBaseName.trim() !== '') {
      setFilename(newFilename); // Use the new prop name
    } else if (editableBaseName.trim() === '') {
      // Revert to original if input is empty
      setEditableBaseName(getBaseName(filename));
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      onBaseNameBlur(); // Apply changes on Enter key
      (event.target as HTMLInputElement).blur(); // Optionally blur the input
    }
  };

  return (
    <div>
      <h3>File Information</h3>

      {/* Editable Filename */}
      <p>
        <strong>Filename:</strong>{' '}
        <input
          type="text"
          value={editableBaseName}
          onChange={onBaseNameChange}
          onBlur={onBaseNameBlur}
          onKeyPress={handleKeyPress}
          style={{ marginLeft: '5px', padding: '2px' }}
        />
        <span>{getExtension(filename)}</span>
      </p>

      {/* Display the number of ports in the Touchstone file. */}
      <p>
        <strong>Port number:</strong> {touchstone.nports}
      </p>

      {/* Frequency Unit Selector: Allows changing the unit for displayed frequencies. */}
      <p>
        <strong>Frequency Unit:</strong>{' '}
        {touchstone.frequency?.unit ? (
          <select
            value={touchstone.frequency.unit || ''} // Use unit from touchstone object
            onChange={(e) => setUnit(e.target.value as FrequencyUnit)}
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
        <strong>Parameter:</strong> {touchstone.parameter}
      </p>

      {/* Format Selector: Allows changing the format of displayed S-parameter data. */}
      <p>
        <strong>Format:</strong>{' '}
        {touchstone.format ? (
          <select
            value={touchstone.format || ''} // Use format from touchstone object
            onChange={(e) => setFormat(e.target.value as TouchstoneFormat)}
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
        {Array.isArray(touchstone.impedance)
          ? touchstone.impedance.join(', ')
          : touchstone.impedance}{' '}
        Ohms
      </p>

      {/* Display any comments found in the Touchstone file. */}
      <div>
        <strong>Comments:</strong>
        <textarea
          value={(touchstone.comments || []).join('\n')} // Use comments from touchstone object
          onChange={(e) => setComments(e.target.value.split('\n'))}
          rows={Math.max(3, (touchstone.comments || []).length)} // Adjust rows
          style={{ width: '100%', marginTop: '5px', padding: '5px', boxSizing: 'border-box' }}
          placeholder="Enter comments here, one per line."
        />
      </div>
    </div>
  )
}

export default FileInfo
