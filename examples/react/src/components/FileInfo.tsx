import React from 'react'
import { Touchstone, FrequencyUnits, type FrequencyUnit, type TouchstoneFormat, type TouchstoneImpedance } from 'rf-touchstone'

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
  /** Callback function to set the new impedance. */
  setImpedance: (newImpedance: TouchstoneImpedance) => void;
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
  setFilename,
  setComments,
  setImpedance, // Added prop
}) => {
  // If no Touchstone data is available, render nothing.
  if (!touchstone) {
    return null
  }

  const getBaseName = (name: string): string => name.substring(0, name.lastIndexOf('.')) || name;
  const getExtension = (name: string): string => name.substring(name.lastIndexOf('.'));

  const [editableBaseName, setEditableBaseName] = React.useState<string>(getBaseName(filename));
  const [editableImpedanceStr, setEditableImpedanceStr] = React.useState<string>(
    Array.isArray(touchstone.impedance) ? touchstone.impedance.join(', ') : String(touchstone.impedance)
  );

  React.useEffect(() => {
    setEditableBaseName(getBaseName(filename));
  }, [filename]);

  React.useEffect(() => {
    // Update local impedance string if touchstone prop changes (e.g., new file loaded)
    setEditableImpedanceStr(
      Array.isArray(touchstone.impedance) ? touchstone.impedance.join(', ') : String(touchstone.impedance)
    );
  }, [touchstone.impedance]);

  const onBaseNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEditableBaseName(event.target.value);
  };

  const onBaseNameBlur = () => {
    const newFilename = editableBaseName + getExtension(filename);
    if (newFilename !== filename && editableBaseName.trim() !== '') {
      setFilename(newFilename);
    } else if (editableBaseName.trim() === '') {
      setEditableBaseName(getBaseName(filename));
    }
  };

  const handleFilenameKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      onBaseNameBlur();
      (event.target as HTMLInputElement).blur();
    }
  };

  const handleImpedanceStrChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEditableImpedanceStr(event.target.value);
  };

  const handleImpedanceBlur = () => {
    const values = editableImpedanceStr.split(',').map(s => s.trim()).filter(s => s !== '');
    let newImpedance: TouchstoneImpedance | null = null;

    if (values.length === 0) {
      alert("Impedance cannot be empty.");
      setEditableImpedanceStr(Array.isArray(touchstone.impedance) ? touchstone.impedance.join(', ') : String(touchstone.impedance)); // Revert
      return;
    }

    const parsedNumbers = values.map(v => parseFloat(v));

    if (parsedNumbers.some(isNaN)) {
      alert("Invalid impedance: All values must be numbers.");
      setEditableImpedanceStr(Array.isArray(touchstone.impedance) ? touchstone.impedance.join(', ') : String(touchstone.impedance)); // Revert
      return;
    }

    if (parsedNumbers.length === 1) {
      newImpedance = parsedNumbers[0];
    } else {
      // Assuming if multiple values, it's for a multi-port scenario.
      // No strict validation against nports here, parent will handle if mismatch is critical.
      newImpedance = parsedNumbers;
    }

    // Check if actually changed to avoid unnecessary updates
    const currentImpedanceStr = Array.isArray(touchstone.impedance) ? touchstone.impedance.join(', ') : String(touchstone.impedance);
    if (editableImpedanceStr !== currentImpedanceStr) {
        setImpedance(newImpedance);
    }
  };

  const handleImpedanceKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleImpedanceBlur();
      (event.target as HTMLInputElement).blur();
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
        <strong>Impedance (Ohms):</strong>{' '}
        <input
          type="text"
          value={editableImpedanceStr}
          onChange={handleImpedanceStrChange}
          onBlur={handleImpedanceBlur}
          onKeyPress={handleImpedanceKeyPress}
          style={{ marginLeft: '5px', padding: '2px', width: '150px' }}
          title="Enter number or comma-separated numbers for multi-port"
        />
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
