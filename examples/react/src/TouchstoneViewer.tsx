import React, { useState, useEffect, useCallback } from 'react'
import {
  Frequency,
  Touchstone,
  type TouchstoneFormat,
} from 'rf-touchstone'
import FileInfo from './components/FileInfo'
import DataTable from './components/DataTable'
import UrlLoader from './components/UrlLoader' // Import the new component

/**
 * Helper function to determine the number of ports from a Touchstone filename (e.g., .s2p -> 2 ports).
 * Moved to module level as it doesn't depend on component state or props.
 * @param filename The filename to parse.
 * @returns The number of ports, or null if not determinable from the extension.
 */
const getNumberOfPorts = (filename: string): number | null => {
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
  // State for providing feedback messages for the copy operation.
  const [copyStatus, setCopyStatus] = useState<string>('')

  /**
   * Loads Touchstone file content from a given URL (typically for remote files or the initial default file).
   * Parses the content and updates the component's state.
   * Also sets the filename based on the URL.
   * @param fileUrl The URL of the Touchstone file to load.
   */
  const loadFileContent = async (fileUrl: string) => {
    // Extract filename from URL for display purposes
    // This logic is similar to what's in handleUrlSubmit, good to consolidate or ensure consistency
    let nameOnly = 'file_from_url.sNp';
    try {
      const urlObject = new URL(fileUrl, window.location.origin); // Add base for relative URLs like '/sample.s2p'
      const pathSegments = urlObject.pathname.split('/');
      nameOnly = pathSegments.pop() || nameOnly;
    } catch (e) {
      nameOnly = fileUrl.substring(fileUrl.lastIndexOf('/') + 1) || nameOnly;
    }
    setFilename(nameOnly);
    setError(null); // Clear previous errors before attempting to load

    try {
      const ts = await readUrl(fileUrl) // Use the module-level readUrl function
      setTouchstone(ts)
      setUnit(ts.frequency?.unit);
      setFormat(ts.format);
      // setError(null) // Already cleared above
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
        // setError(null) // Already cleared
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
    // setError(null); // loadFileContent will handle clearing errors and setting filename
    // No need to extract filename here, loadFileContent does it.
    await loadFileContent(url); // loadFileContent handles fetching, parsing, and state updates including filename
  };

  /**
   * Handles the "Copy Data" button click.
   * Converts the current Touchstone data to its string representation and copies it to the clipboard.
   * Provides user feedback via `copyStatus` state.
   */
  const handleCopyData = async () => {
    if (!touchstone) {
      setCopyStatus('No data to copy.')
      setTimeout(() => setCopyStatus(''), 3000)
      return
    }
    try {
      const fileContentString = touchstone.toString()
      await navigator.clipboard.writeText(fileContentString)
      setCopyStatus('Copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy data:', err)
      setCopyStatus('Failed to copy.')
    } finally {
      setTimeout(() => setCopyStatus(''), 3000)
    }
  }

  /**
   * Handles the "Download File" button click.
   * Converts the current Touchstone data to its string representation and initiates a file download.
   */
  const handleDownloadFile = () => {
    if (!touchstone) {
      console.warn('No data to download.')
      return
    }
    try {
      const fileContentString = touchstone.toString()
      const blob = new Blob([fileContentString], {
        type: 'text/plain;charset=utf-8',
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename || `data.s${touchstone.nports || ''}p` // Use filename state
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to download file:', err)
    }
  }

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
        <button onClick={handleCopyData} disabled={!touchstone}>
          Copy Data
        </button>
        <button
          onClick={handleDownloadFile}
          disabled={!touchstone}
          style={{ marginLeft: '10px' }}
        >
          Download File
        </button>
        {copyStatus && <span style={{ marginLeft: '10px' }}>{copyStatus}</span>}
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
