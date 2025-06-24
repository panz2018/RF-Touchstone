import React, { useState, useEffect, useCallback } from 'react'
import {
  Frequency,
  Touchstone,
  type TouchstoneFormat,
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
  // State for the currently loaded Touchstone object.
  const [touchstone, setTouchstone] = useState<Touchstone | null>(null);
  // State for the selected frequency unit for display.
  const [unit, setUnit] = useState<string | undefined>();
  // State for the selected S-parameter format for display.
  const [format, setFormat] = useState<string | undefined>();
  // State for storing any error messages.
  const [error, setError] = useState<string | null>(null)
  // State for the name of the currently loaded or selected file.
  const [filename, setFilename] = useState<string>('') // Initialize empty, set on load
  // State for editable comments, distinct from touchstone.comments for UI interaction
  const [comments, setComments] = useState<string[]>([])
  // copyStatus state is now managed by CopyButton.tsx

  /**
   * Loads Touchstone file content from a given URL (typically for remote files or the initial default file).
   * Parses the content and updates the component's state.
   * Also sets the filename based on the URL.
   * @param fileUrl The URL of the Touchstone file to load.
   */
  const loadFileContent = async (fileUrl: string) => {
    let nameOnly: string | undefined = undefined;
    try {
      // Attempt to parse filename from URL
      // For relative URLs like '/sample.s2p', URL constructor needs a base.
      const tempUrl = new URL(fileUrl, window.location.origin);
      const pathSegments = tempUrl.pathname.split('/');
      nameOnly = pathSegments.pop();
    } catch (e) {
      // If URL parsing fails (e.g. not a valid URL string), try simple substring
      // This might be the case for non-URL strings if they somehow reach here, though unlikely for fileUrl.
      const lastSlash = fileUrl.lastIndexOf('/');
      if (lastSlash !== -1) {
        nameOnly = fileUrl.substring(lastSlash + 1);
      } else {
        // If no slash, and not a valid URL, consider the whole string as potential filename
        // but only if it's not empty. This case should ideally not happen with valid URLs.
        nameOnly = fileUrl;
      }
    }

    // Validate if a name was actually extracted
    if (!nameOnly || nameOnly.trim() === '') {
      setError(`Could not determine a valid filename from URL: ${fileUrl}`);
      setFilename(''); // Clear filename
      setTouchstone(null);
      setComments([]);
      return;
    }

    setFilename(nameOnly);
    setError(null); // Clear previous errors before attempting to load

    try {
      const ts = await readUrl(fileUrl) // Use the module-level readUrl function
      setTouchstone(ts)
      setUnit(ts.frequency?.unit);
      setFormat(ts.format);
      setComments(ts.comments || []); // Initialize/update comments
    } catch (err) {
      console.error(`Error loading or parsing Touchstone file from URL ${fileUrl}:`, err)
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred.'
      )
      setTouchstone(null) // Clear data on error
    }
  }

  /**
   * Effect hook to load the default Touchstone file (sample.s2p) when the component mounts.
   */
  useEffect(() => {
    // Set initial filename and load content for the default file
    // setFilename('sample.s2p'); // Set filename before loading
    loadFileContent('/sample.s2p'); // loadFileContent will now also set the filename
  }, []); // Empty dependency array ensures this runs only once on mount

  /**
   * Handles the change event when a user selects a new file via the input element.
   * Reads the file content, parses it, and updates the state.
   * @param event The React change event from the file input.
   */
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setFilename(file.name); // Update filename state for display
      setError(null);       // Clear previous errors

      try {
        const ts = await readFile(file) // Use the module-level readFile function
        setTouchstone(ts)
        setUnit(ts.frequency?.unit);
        setFormat(ts.format);
        setComments(ts.comments || []); // Initialize/update comments
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
   * Handles changes to the selected frequency unit.
   * It creates a new Touchstone object with frequencies scaled to the new unit.
   * @param newUnitString The new frequency unit string (e.g., "GHz", "MHz").
   */
  const handleUnitChange = (newUnitString: string) => {
    if (touchstone?.frequency) {
      const frequenciesInHz = touchstone.frequency.f_Hz;
      const updatedTouchstone = new Touchstone();
      Object.assign(updatedTouchstone, touchstone);

      const newFrequency = new Frequency();
      newFrequency.f_Hz = frequenciesInHz;
      newFrequency.unit = newUnitString as any; // `unit` setter handles scaling

      updatedTouchstone.frequency = newFrequency;
      setTouchstone(updatedTouchstone);
    }
  }

  /**
   * Handles changes to the selected S-parameter display format.
   * It creates a new Touchstone object with the updated format property.
   * @param newFormatString The new format string ('RI', 'MA', 'DB').
   */
  const handleFormatChange = (newFormatString: string) => {
    if (touchstone) {
      const updatedTouchstone = new Touchstone()
      Object.assign(updatedTouchstone, touchstone)
      updatedTouchstone.format = newFormatString as TouchstoneFormat;
      setTouchstone(updatedTouchstone)
    }
  }

  /**
   * Handles the submission of a URL from the UrlLoader component.
   * It attempts to load and parse the Touchstone file from the given URL.
   * @param url The URL string of the Touchstone file.
   */
  const handleUrlSubmit = async (url: string) => {
    await loadFileContent(url); // loadFileContent handles filename extraction, fetching, parsing, and state updates
  };

  /**
   * Handles changes to the filename from the FileInfo component.
   * @param newName The new full filename (base + extension).
   */
  const handleFilenameChange = (newName: string) => {
    setFilename(newName);
  };

  /**
   * Handles updates to comments from the FileInfo component.
   * It updates both the local `comments` state and the `comments` property
   * of the main `touchstone` object to ensure consistency for display and export.
   * @param newCommentsArray An array of strings representing the new comments.
   */
  const handleCommentsUpdate = (newCommentsArray: string[]) => {
    setComments(newCommentsArray); // Update the local state for FileInfo's textarea

    if (touchstone) {
      // Also update the touchstone object itself so that copy/download reflect changes
      const updatedTouchstone = new Touchstone();
      Object.assign(updatedTouchstone, touchstone); // Clone existing touchstone
      updatedTouchstone.comments = [...newCommentsArray]; // Set new comments
      setTouchstone(updatedTouchstone); // Update the touchstone state
    }
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
          onChange={handleFileChange}
        />
      </div>

      {/* URL Loader Section */}
      <div style={{ marginTop: '10px' }}>
        <UrlLoader onUrlSubmit={handleUrlSubmit} />
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
            unit={unit}
            handleUnitChange={handleUnitChange}
            format={format}
            handleFormatChange={handleFormatChange}
            filename={filename}
            handleFilenameChange={handleFilenameChange}
            comments={comments}
            handleCommentsChange={handleCommentsUpdate}
          />
          {/* Data Table Component */}
          <DataTable
            touchstone={touchstone}
            unit={unit}
            format={format}
          />
        </>
      )}
    </div>
  )
}

export default TouchstoneViewer

// --- Helper Functions (Moved to bottom) ---

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
 * @param fileUrl The URL of the Touchstone file to load.
 * @returns A Promise that resolves to a Touchstone object.
 * @throws An error if fetching or parsing fails.
 */
const readUrl = async (fileUrl: string): Promise<Touchstone> => {
  console.log('[DEBUG] readUrl called with fileUrl:', fileUrl);
  try {
    const response = await fetch(fileUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`)
    }
    const textContent = await response.text()
    // getNumberOfPorts is now a module-level function
    const nports = getNumberOfPorts(fileUrl.substring(fileUrl.lastIndexOf('/') + 1)) // Pass only filename part
    if (nports === null) {
      throw new Error(
        `Could not determine number of ports from file name: ${fileUrl}`
      )
    }
    const ts = new Touchstone()
    ts.readContent(textContent, nports)
    return ts
  } catch (err) {
    // Re-throw the error to be handled by the caller
    throw err
  }
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
        const nports = getNumberOfPorts(file.name) // Use module-level function
        if (nports === null) {
          reject(
            new Error(
              `Could not determine number of ports from file name: ${file.name}`
            )
          )
          return
        }
        const ts = new Touchstone()
        ts.readContent(textContent, nports)
        resolve(ts)
      } catch (err) {
        reject(err) // Catch errors from Touchstone parsing or nports
      }
    }

    reader.onerror = () => {
      reject(new Error('Error reading file.'))
    }

    reader.readAsText(file)
  })
}
