import React, { useState, useEffect, useCallback } from 'react'
import {
  Frequency,
  Touchstone,
  type TouchstoneFormat,
} from 'rf-touchstone'
import FileInfo from './components/FileInfo'
import DataTable from './components/DataTable'

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
  const [fileName, setFileName] = useState<string>('sample.s2p') // Default sample file
  // State for providing feedback messages for the copy operation.
  const [copyStatus, setCopyStatus] = useState<string>('')

  /**
   * Helper function to determine the number of ports from a Touchstone filename (e.g., .s2p -> 2 ports).
   * @param currentFileName The filename to parse.
   * @returns The number of ports, or null if not determinable from the extension.
   */
  const getNumberOfPorts = (currentFileName: string): number | null => {
    const match = currentFileName.match(/\.s(\d+)p$/i)
    if (match && match[1]) {
      return parseInt(match[1], 10)
    }
    return null
  }

  /**
   * Loads Touchstone file content from a given URL.
   * Parses the content and updates the component's state.
   * Wrapped in useCallback to stabilize its identity for useEffect dependencies.
   * @param fileUrl The URL of the Touchstone file to load.
   */
  const loadFileContent = useCallback(async (fileUrl: string) => {
    try {
      const response = await fetch(fileUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`)
      }
      const textContent = await response.text()
      const nports = getNumberOfPorts(fileUrl)
      if (nports === null) {
        throw new Error(
          `Could not determine number of ports from file name: ${fileUrl}`
        )
      }
      const ts = new Touchstone()
      ts.readContent(textContent, nports)
      setTouchstone(ts)
      setError(null) // Clear any previous errors
    } catch (err) {
      console.error('Error loading or parsing Touchstone file:', err)
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred.'
      )
      setTouchstone(null) // Clear data on error
    }
  }, []) // Empty dependency array: function created once and doesn't depend on component state/props.

  /**
   * Effect hook to load the default Touchstone file (sample.s2p) when the component mounts
   * or when the `fileName` state changes (e.g., if it were to be set programmatically for the default load).
   * Dependencies: `fileName`, `loadFileContent`.
   */
  useEffect(() => {
    if (fileName) {
        loadFileContent(`/${fileName}`);
    }
  }, [fileName, loadFileContent]);

  /**
   * Effect hook to update the displayed unit and format when new Touchstone data is loaded.
   * Runs whenever the `touchstone` state object changes.
   * Dependencies: `touchstone`.
   */
  useEffect(() => {
    if (touchstone) {
      setUnit(touchstone.frequency?.unit);
      setFormat(touchstone.format);
    }
  }, [touchstone])

  /**
   * Handles the change event when a user selects a new file via the input element.
   * Reads the file content, parses it, and updates the state.
   * @param event The React change event from the file input.
   */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setFileName(file.name) // Update displayed filename
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const textContent = e.target?.result as string
          if (textContent) {
            const nports = getNumberOfPorts(file.name)
            if (nports === null) {
              throw new Error(
                `Could not determine number of ports from file name: ${file.name}`
              )
            }
            const ts = new Touchstone()
            ts.readContent(textContent, nports)
            setTouchstone(ts)
            setError(null) // Clear previous errors
          } else {
            throw new Error('File content is empty.')
          }
        } catch (err) {
          console.error('Error parsing uploaded Touchstone file:', err)
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to parse uploaded file.'
          )
          setTouchstone(null) // Clear data on error
        }
      }
      reader.onerror = () => {
        setError('Error reading file.')
        setTouchstone(null) // Clear data on error
      }
      reader.readAsText(file)
    }
  }

  /**
   * Handles changes to the selected frequency unit.
   * It creates a new Touchstone object with frequencies scaled to the new unit.
   * @param newUnit The new frequency unit string (e.g., "GHz", "MHz").
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
      const fileContentString = touchstone.toString() // Assumes Touchstone.toString() exists and is correct
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
      const fileContentString = touchstone.toString() // Assumes Touchstone.toString() exists
      const blob = new Blob([fileContentString], {
        type: 'text/plain;charset=utf-8',
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName || `data.s${touchstone.nports || ''}p`
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

      {/* Action Buttons Section (Copy/Download) */}
      <div>
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
          ? `Data from ${fileName}`
          : error
          ? `Error with ${fileName}`
          : `Loading ${fileName}...`}
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
