import React, { useState, useEffect } from 'react'
import {
  Frequency,
  Touchstone,
  type TouchstoneFormat,
  type FrequencyUnit,
  type TouchstoneMatrix, // Import TouchstoneMatrix
} from 'rf-touchstone'
import FileInfo from './components/FileInfo'
import DataTable from './components/DataTable'
import UrlLoader from './components/UrlLoader'
import CopyButton from './components/CopyButton'
import DownloadButton from './components/DownloadButton'

/**
 * TouchstoneViewer component.
 * Main component for loading, viewing, and interacting with Touchstone (.sNp) files.
 * It manages the Touchstone data, handles file input, unit/format changes,
 * and provides copy/download functionality.
 */
const TouchstoneViewer: React.FC = () => {
  // State for the currently loaded Touchstone object. This object serves as the single source
  // of truth for Touchstone data including its unit, format, and comments.
  const [touchstone, setTouchstone] = useState<Touchstone | null>(null);
  // State for storing any error messages encountered during file loading or processing.
  const [error, setError] = useState<string | null>(null)
  // State for the name of the currently loaded or selected file. This is managed separately
  // to allow user edits to the filename independent of the Touchstone object's internal metadata.
  const [filename, setFilename] = useState<string>('')

  /**
   * Loads Touchstone file content from a given URL.
   * Parses the content and updates the component's state.
   * Also sets the filename based on the URL.
   * @param url The URL of the Touchstone file to load.
   */
  const loadUrl = async (url: string) => {
    let activeFilename = ''; // Stores the filename if successfully extracted before further processing.
    try {
      const nameOnly = getFilenameFromUrl(url);

      if (!nameOnly || nameOnly.trim() === '') {
        // Specific error for filename parsing failure
        throw new Error(`Could not determine a valid filename from URL: ${url}`);
      }

      activeFilename = nameOnly; // Store valid filename
      setFilename(activeFilename);
      setError(null); // Clear previous errors before new load attempt.

      const ts = await readUrl(url);
      setTouchstone(ts);

    } catch (err) {
      console.error(`Error processing URL ${url}:`, err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setTouchstone(null);
      // If the error was due to filename parsing, filename might not have been set or should be cleared.
      // If activeFilename is still empty, it implies filename parsing failed.
      if (activeFilename.trim() === '' && url) {
        // If filename parsing itself failed, ensure filename state is also cleared.
        // The error message from the specific throw above will be displayed.
        setFilename('');
      }
      // If activeFilename was set but readUrl failed, filename state remains,
      // and the error message will be "Error with {activeFilename}"
    }
  }

  /**
   * Effect hook to load the default Touchstone file (sample.s2p) when the component mounts.
   */
  useEffect(() => {
    loadUrl('/sample.s2p');
  }, []); // Empty dependency array ensures this runs only once on mount

  /**
   * Handles a local file upload via the file input element.
   * Reads the selected file's content, parses it as Touchstone data, and updates the state.
   * @param event The React change event from the file input.
   */
  const uploadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setFilename(file.name);
      setError(null);       // Clear previous errors

      try {
        const ts = await readFile(file)
        setTouchstone(ts)
      } catch (err) {
        console.error('Error processing uploaded Touchstone file:', err)
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to process uploaded file.'
        )
        setTouchstone(null) // Clear data on error
      }
      // Reset the input value to allow re-uploading the same file name
      if (event.target) {
        (event.target as HTMLInputElement).value = '';
      }
    }
  }

  /**
   * Updates the frequency unit for the current Touchstone data.
   * Creates a new Touchstone object with scaled frequencies and updates the state.
   * @param unit The new frequency unit.
   */
  const setUnit = (unit: FrequencyUnit) => {
    if (touchstone?.frequency) {
      const frequenciesInHz = touchstone.frequency.f_Hz;
      const updatedTouchstone = new Touchstone();
      Object.assign(updatedTouchstone, touchstone);

      const newFrequency = new Frequency();
      newFrequency.f_Hz = frequenciesInHz;
      newFrequency.unit = unit; // Use the specific FrequencyUnit type

      updatedTouchstone.frequency = newFrequency;
      setTouchstone(updatedTouchstone); // Update the main touchstone state
    }
  }

  /**
   * Updates the S-parameter display format for the current Touchstone data.
   * Creates a new Touchstone object with the new format and updates the state.
   * @param format The new S-parameter display format.
   */
  const setFormat = (format: TouchstoneFormat) => {
    if (touchstone) {
      const updatedTouchstone = new Touchstone()
      Object.assign(updatedTouchstone, touchstone)
      updatedTouchstone.format = format;
      setTouchstone(updatedTouchstone) // Update the main touchstone state
    }
  }

  /**
   * Updates the comments for the current Touchstone data.
   * Creates a new Touchstone object with the new comments and updates the state.
   * @param comments An array of strings representing the new comments.
   */
  const setComments = (comments: string[]) => {
    if (touchstone) {
      const updatedTouchstone = new Touchstone();
      Object.assign(updatedTouchstone, touchstone); // Create a new instance based on the current one
      updatedTouchstone.comments = [...comments];
      setTouchstone(updatedTouchstone);
    }
  };

  /**
   * Updates the Touchstone data's S-parameter matrix and frequencies.
   * Assumes input `frequencies` are in the unit of the current `touchstone` object.
   * Preserves other metadata (format, comments, impedance, parameter). `nports` is NOT changed by this function.
   * @param matrix The new S-parameter matrix (`TouchstoneMatrix`).
   * @param frequencies The new array of frequency values (assumed to be in the current `touchstone`'s frequency unit).
   */
  const updateMatrixFrequency = (matrix: TouchstoneMatrix, frequencies: number[]) => {
    if (!touchstone) {
      const msg = "Cannot update matrix/frequency: No base Touchstone data is currently loaded.";
      console.error(msg);
      setError(msg);
      return;
    }

    if (!touchstone.frequency || typeof touchstone.frequency.unit === 'undefined') {
      const msg = "Cannot update matrix/frequency: Current Touchstone data is missing essential frequency unit information.";
      console.error(msg);
      setError(msg);
      setTouchstone(null); // Clear potentially inconsistent data
      return;
    }

    const updatedTouchstone = new Touchstone();
    // Preserve existing metadata by copying from the current touchstone object
    Object.assign(updatedTouchstone, {
      ...touchstone,
      comments: [...touchstone.comments],
    });

    updatedTouchstone.matrix = matrix;

    // Create and set the new frequency object
    const newFrequency = new Frequency();
    newFrequency.unit = touchstone.frequency.unit; // Now safe due to the check above
    newFrequency.f_scaled = frequencies;

    updatedTouchstone.frequency = newFrequency;

    setTouchstone(updatedTouchstone);
  };

  /**
   * Updates the impedance for the current Touchstone data.
   * Creates a new Touchstone object with the new impedance and updates the state.
   * @param newImpedance The new impedance value or array of values.
   */
  const setImpedance = (newImpedance: TouchstoneImpedance) => {
    if (!touchstone) {
      const msg = "Cannot set impedance: No Touchstone data loaded.";
      console.error(msg);
      setError(msg);
      return;
    }
    const updatedTouchstone = new Touchstone();
    Object.assign(updatedTouchstone, touchstone);
    updatedTouchstone.impedance = newImpedance;
    setTouchstone(updatedTouchstone);
  };

  return (
    <div>
      <h2>Touchstone File Viewer</h2>

      {/* File Input Section */}
      <div>
        <label htmlFor="fileInput">Upload a Touchstone file (.sNp): </label>
        <input
          type="file"
          id="fileInput"
          accept=".s1p,.s2p,.s3p,.s4p,.s5p,.s6p,.s7p,.s8p,.s9p,.s10p,.s11p,.s12p,.s13p,.s14p,.s15p,.s16p,.s17p,.s18p,.s19p,.s20p"
            onChange={uploadFile}
        />
      </div>

      {/* URL Loader Section */}
      <div style={{ marginTop: '10px' }}>
        <UrlLoader onUrlSubmit={loadUrl} />
      </div>

      {/* Action Buttons Section (Copy/Download) */}
      <div style={{ marginTop: '20px' }}>
        <CopyButton touchstone={touchstone} />
        <DownloadButton touchstone={touchstone} filename={filename} />
      </div>

      {/* Status/Error Message Display */}
      <p>
        Currently displaying:{' '}
        {touchstone
          ? `Data from ${filename}` // Use filename state
          : error
          ? `Error with ${filename}` // Use filename state
          : `Loading ${filename}...`} {/* Use filename state */}
      </p>
      {error && <pre style={{ color: 'red' }}>Error: {error}</pre>}

      {/* Conditional Rendering for Touchstone Data */}
      {touchstone && (
        <>
          {/* File Information and Controls Component */}
          <FileInfo
            touchstone={touchstone}
            setUnit={setUnit}
            setFormat={setFormat}
            filename={filename}
            setFilename={setFilename}
            setComments={setComments}
            setImpedance={setImpedance} // Pass setImpedance
          />
          {/* Data Table Component */}
          <DataTable
            touchstone={touchstone}
            filename={filename} // For CSV download naming
            setMatrix={updateMatrixFrequency} // For CSV upload to update matrix/frequencies
          />
        </>
      )}
    </div>
  )
}

export default TouchstoneViewer

/**
 * Helper function to determine the number of ports from a Touchstone filename (e.g., .s2p -> 2 ports).
 * Moved to module level as it doesn't depend on component state or props.
 * @param filename The filename to parse.
 * @returns The number of ports, or null if not determinable from the extension.
 */
const getNumberOfPorts = (filename: string): number | null => {
  console.log('[DEBUG] getNumberOfPorts called with filename:', filename);
  const match = filename.match(/\.s(\d+)p$/i)
  if (match && match[1]) {
    return parseInt(match[1], 10)
  }
  return null
}

/**
 * Reads a Touchstone file from a given URL, parses it, and returns a Touchstone object.
 * @param url The URL of the Touchstone file to load.
 * @returns A Promise that resolves to a Touchstone object.
 * @throws An error if fetching or parsing fails.
 */
const readUrl = async (url: string): Promise<Touchstone> => {
  console.log('[DEBUG] readUrl called with url:', url);
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.statusText}`)
  }
  const textContent = await response.text()
  const filenameForPortCheck = getFilenameFromUrl(url);
  const nports = getNumberOfPorts(filenameForPortCheck)
  if (nports === null) {
    throw new Error(
      `Could not determine number of ports from file name: ${filenameForPortCheck} (derived from URL: ${url})`
    )
  }
  return readText(textContent, nports);
}

/**
 * Reads a File object, parses its content as Touchstone data, and returns a Touchstone object.
 * @param file The File object to read.
 * @returns A Promise that resolves to a Touchstone object.
 * @throws An error if reading or parsing fails.
 */
const readFile = (file: File): Promise<Touchstone> => {
  console.log('[DEBUG] readFile called with file - name:', file.name, 'size:', file.size, 'type:', file.type);
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const textContent = e.target?.result as string
        if (!textContent) {
          reject(new Error('File content is empty.'))
          return
        }
        const nports = getNumberOfPorts(file.name)
        if (nports === null) {
          reject(
            new Error(
              `Could not determine number of ports from file name: ${file.name}`
            )
          )
          return
        }
        resolve(readText(textContent, nports));
      } catch (err) {
        reject(err) // Catch errors from Touchstone parsing or nports (readText might throw)
      }
    }

    reader.onerror = () => {
      reject(new Error('Error reading file.'))
    }

    reader.readAsText(file)
  })
}

/**
 * Parses text content into a Touchstone object.
 * @param textContent The string content of the Touchstone file.
 * @param nports The number of ports for the Touchstone file.
 * @returns A Touchstone object.
 * @throws An error if parsing fails.
 */
const readText = (textContent: string, nports: number): Touchstone => {
  console.log('[DEBUG] readText called with textContent length:', textContent.length, 'and nports:', nports);
  const ts = new Touchstone();
  ts.readContent(textContent, nports);
  return ts;
}

/**
 * Extracts a filename from a URL string.
 * It takes the part of the string after the last '/' character.
 * If no '/' is found, the original string is returned.
 * @param url The URL string.
 * @returns The extracted filename or the original URL if no path is present.
 */
const getFilenameFromUrl = (url: string): string => {
  console.log('[DEBUG] getFilenameFromUrl called with url:', url);
  const lastSlash = url.lastIndexOf('/');
  return lastSlash !== -1 ? url.substring(lastSlash + 1) : url;
};
