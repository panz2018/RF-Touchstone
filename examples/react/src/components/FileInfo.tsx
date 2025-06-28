import React from 'react';
import { Touchstone, type TouchstoneImpedance, type FrequencyUnit, type TouchstoneFormat } from 'rf-touchstone';
import FilenameEditor from './fileinfo/FilenameEditor';
import CommentsEditor from './fileinfo/CommentsEditor';
import ImpedanceEditor from './fileinfo/ImpedanceEditor';
import FrequencyUnitEditor from './fileinfo/FrequencyUnitEditor';
import DataFormatEditor from './fileinfo/DataFormatEditor';

/**
 * Props for the FileInfo component.
 */
interface FileInfoProps {
  /** The loaded Touchstone data object, or null if no data is loaded. */
  touchstone: Touchstone | null;
  /** The current filename. */
  filename: string;
  /** Callback function to update the filename in the parent component. */
  setFilename: (newName: string) => void;
  /** Callback function to set the new comments. */
  setComments: (comments: string[]) => void;
  /** Callback function to set the new impedance. */
  setImpedance: (newImpedance: TouchstoneImpedance) => void;
  /** Callback function to set the new frequency unit. */
  setUnit: (unit: FrequencyUnit) => void;
  /** Callback function to set the new data format. */
  setFormat: (format: TouchstoneFormat) => void;
}

/**
 * FileInfo component.
 * Acts as a container for various editors and displays related to Touchstone file metadata.
 * It receives the main `touchstone` object and handler functions from its parent
 * and delegates specific pieces of data and their corresponding update handlers
 * to specialized sub-components.
 */
const FileInfo: React.FC<FileInfoProps> = ({
  touchstone,
  filename,
  setFilename,
  setComments,
  setImpedance,
  setUnit,
  setFormat,
}) => {
  if (!touchstone) {
    return (
      <div>
        <h3>File Information</h3>
        <p>No Touchstone data loaded.</p>
      </div>
    );
  }

  return (
    <div>
      <h3>File Information</h3>

      <FilenameEditor
        currentFilename={filename}
        onFilenameChange={setFilename}
      />

      {/* Display static port number and parameter type */}
      <p>
        <strong>Port number:</strong> {touchstone.nports ?? 'N/A'}
      </p>
      <p>
        <strong>Parameter:</strong> {touchstone.parameter ?? 'N/A'}
      </p>

      <FrequencyUnitEditor
        currentUnit={touchstone.frequency?.unit}
        onUnitChange={setUnit}
        disabled={!touchstone.frequency}
      />

      <DataFormatEditor
        currentFormat={touchstone.format}
        onFormatChange={setFormat}
        disabled={!touchstone.format}
      />

      <ImpedanceEditor
        currentImpedance={touchstone.impedance}
        onImpedanceChange={setImpedance}
      />

      <CommentsEditor
        currentComments={touchstone.comments || []}
        onCommentsChange={setComments}
      />
    </div>
  );
};

export default FileInfo;
