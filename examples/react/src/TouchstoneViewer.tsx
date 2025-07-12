import React, { useState, useEffect } from 'react'
import { Frequency, Touchstone } from 'rf-touchstone'
import type {
  TouchstoneFormat,
  FrequencyUnit,
  TouchstoneMatrix,
  TouchstoneImpedance,
} from 'rf-touchstone'
import FileLoader from './components/FileLoader'
import UrlLoader from './components/UrlLoader'
import CopyButton from './components/CopyButton'
import DownloadButton from './components/DownloadButton'
import FilenameEditor from './components/fileinfo/FilenameEditor'
import FrequencyUnitEditor from './components/fileinfo/FrequencyUnitEditor'
import ImpedanceEditor from './components/fileinfo/ImpedanceEditor'
import DataFormatEditor from './components/fileinfo/DataFormatEditor'
import CommentsEditor from './components/fileinfo/CommentsEditor'
import DataTable from './components/DataTable'

/**
 * TouchstoneViewer component.
 * Main component for loading, viewing, and interacting with Touchstone (.sNp) files.
 * It manages the Touchstone data, handles file input, unit/format changes,
 * and provides copy/download functionality.
 */
const TouchstoneViewer: React.FC = () => {
  // State for the currently loaded Touchstone object. This object serves as the single source
  // of truth for Touchstone data including its unit, format, and comments.
  const [touchstone, setTouchstone] = useState<Touchstone | null>(null)
  // State for the name of the currently loaded or selected file. This is managed separately
  // to allow user edits to the filename independent of the Touchstone object's internal metadata.
  const [filename, setFilename] = useState<string>('')
  // Global error state to display significant errors to the user.
  const [error, setError] = useState<string | null>(null)

  /**
   * Loads Touchstone file content from a given URL.
   * Parses the content and updates the component's state.
   * Also sets the filename based on the URL.
   * Handles errors during the entire process and sets a single error message.
   * @param url The URL of the Touchstone file to load.
   */
  const loadUrl = async (url: string) => {
    let activeFilename = '' // Stores the filename if successfully extracted before further processing.
    try {
      setError(null) // Clear previous errors before new load attempt.

      // 1. Extract filename from URL
      const nameOnly = getFilenameFromUrl(url)

      // 2. Validate filename
      if (!nameOnly || nameOnly.trim() === '') {
        // Specific error for filename parsing failure
        throw new Error(`Could not determine a valid filename from URL: ${url}`)
      }

      activeFilename = nameOnly // Store valid filename
      setFilename(activeFilename)

      // 3. Read content from URL (readUrl throws errors)
      const ts = await readUrl(url)

      // 4. If successful, update state with loaded data
      setTouchstone(ts)
    } catch (err) {
      // --- Unified error handling ---
      console.error(`Error processing URL ${url}:`, err)
      setError(
        err instanceof Error
          ? `Error loading ${activeFilename || url}: ${err.message}` // Include filename in error message
          : `An unknown error occurred while loading ${activeFilename || url}.`
      )
      // Clear data on error
      setTouchstone(null)
    }
  }

  /**
   * Effect hook to load the default Touchstone file (sample.s2p) when the component mounts.
   */
  useEffect(() => {
    loadUrl('/sample.s2p')
  }, []) // Empty dependency array ensures this runs only once on mount

  /**
   * Handles a local file upload.
   * Reads the selected file's content, parses it as Touchstone data, and updates the state.
   * Handles errors during the process and sets a single error message.
   * @param file The File object to upload.
   */
  const uploadFile = async (file: File) => {
    if (file) {
      setFilename(file.name)
      setError(null) // Clear previous errors before starting upload

      try {
        const ts = await readFile(file) // readFile throws errors
        setTouchstone(ts)
      } catch (err) {
        console.error('Error processing uploaded Touchstone file:', err)
        setError(
          err instanceof Error
            ? `Error uploading ${file.name}: ${err.message}` // Include filename in error message
            : `An unknown error occurred while uploading ${file.name}.`
        )
        setTouchstone(null) // Clear data on error
      }
    }
  }

  /**
   * Updates the frequency unit for the current Touchstone data.
   * Creates a new Touchstone object with scaled frequencies and updates the state.
   * @param unit The new frequency unit.
   */
  const setUnit = (unit: FrequencyUnit) => {
    if (!touchstone || !touchstone.frequency) {
      throw new Error(
        'Cannot set unit: Touchstone data or frequency information is missing.'
      )
    }
    // Proceed with creating a new Touchstone object if touchstone and frequency info exist
    const frequenciesInHz = touchstone.frequency.f_Hz
    const updatedTouchstone = new Touchstone()
    Object.assign(updatedTouchstone, touchstone)

    const newFrequency = new Frequency()
    newFrequency.f_Hz = frequenciesInHz
    newFrequency.unit = unit

    updatedTouchstone.frequency = newFrequency
    setTouchstone(updatedTouchstone)
  }

  /**
   * Updates the S-parameter display format for the current Touchstone data.
   * Creates a new Touchstone object with the new format and updates the state.
   * @param format The new S-parameter display format.
   */
  const setFormat = (format: TouchstoneFormat) => {
    if (!touchstone) {
      throw new Error('Cannot set format: No Touchstone data loaded.')
    }
    const updatedTouchstone = new Touchstone()
    Object.assign(updatedTouchstone, touchstone)
    updatedTouchstone.format = format
    setTouchstone(updatedTouchstone)
  }

  /**
   * Updates the comments for the current Touchstone data.
   * Creates a new Touchstone object with the new comments and updates the state.
   * @param comments An array of strings representing the new comments.
   */
  const setComments = (comments: string[]) => {
    if (!touchstone) {
      throw new Error('Cannot set comments: No Touchstone data loaded.')
    }
    const updatedTouchstone = new Touchstone()
    Object.assign(updatedTouchstone, touchstone)
    updatedTouchstone.comments = [...comments]
    setTouchstone(updatedTouchstone)
  }

  /**
   * Updates the Touchstone data's S-parameter matrix and frequencies.
   * Assumes input `frequencies` are in the unit of the current `touchstone` object.
   * Preserves other metadata (format, comments, impedance, parameter). `nports` is NOT changed by this function.
   * @param matrix The new S-parameter matrix (`TouchstoneMatrix`).
   * @param frequencies The new array of frequency values (assumed to be in the current `touchstone`'s frequency unit).
   */
  const updateMatrixFrequency = (
    matrix: TouchstoneMatrix,
    frequencies: number[]
  ) => {
    if (!touchstone) {
      throw new Error(
        'Cannot update matrix/frequency: No base Touchstone data is currently loaded.'
      )
    }

    if (
      !touchstone.frequency ||
      typeof touchstone.frequency.unit === 'undefined'
    ) {
      // This indicates an inconsistent state if touchstone is loaded but frequency/unit is not.
      throw new Error(
        'Cannot update matrix/frequency: Current Touchstone data is missing essential frequency unit information.'
      )
    }

    const updatedTouchstone = new Touchstone()
    // Preserve existing metadata by copying from the current touchstone object
    Object.assign(updatedTouchstone, touchstone)

    updatedTouchstone.matrix = matrix

    // Create and set the new frequency object
    const newFrequency = new Frequency()
    newFrequency.unit = touchstone.frequency.unit
    newFrequency.f_scaled = frequencies

    updatedTouchstone.frequency = newFrequency

    setTouchstone(updatedTouchstone)
  }

  /**
   * Updates the impedance for the current Touchstone data.
   * Creates a new Touchstone object with the new impedance and updates the state.
   * @param impedance The new impedance value or array of values.
   */
  const setImpedance = (impedance: TouchstoneImpedance) => {
    if (!touchstone) {
      throw new Error('Cannot set impedance: No Touchstone data loaded.')
    }
    const updatedTouchstone = new Touchstone()
    Object.assign(updatedTouchstone, touchstone)
    updatedTouchstone.impedance = impedance
    setTouchstone(updatedTouchstone)
  }

  return (
    <table className="TouchstoneViewer">
      <tbody>
        {/* Row for File Upload/URL Load */}
        <tr>
          <td>Upload a Touchstone (.sNp) file:</td>
          <td>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* File Input Section */}
              <FileLoader uploadFile={uploadFile} />
              {/* URL Loader Section */}
              <UrlLoader onUrlSubmit={loadUrl} />
            </div>
          </td>
        </tr>

        {/* Row for Error Message (conditionally rendered) */}
        {error && (
          <tr>
            <td colSpan={2}>
              <pre
                style={{
                  color: 'red',
                  fontWeight: 'bold',
                  marginTop: '10px',
                }}
              >
                {error}
              </pre>
            </td>
          </tr>
        )}

        {/* Conditional rendering for sections that depend on touchstone data */}
        {touchstone && (
          <>
            {/* Row for Download/Copy Buttons */}
            <tr>
              <td>Download Touchstone file:</td>
              <td>
                {/* Action Buttons Section (Copy/Download) */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <DownloadButton touchstone={touchstone} filename={filename} />
                  <CopyButton touchstone={touchstone} />
                </div>
              </td>
            </tr>

            {/* Row for Filename Editor */}
            <tr>
              <td>
                <label>Filename:</label>
              </td>
              <td>
                <FilenameEditor
                  currentFilename={filename}
                  onFilenameChange={setFilename}
                />
              </td>
            </tr>

            {/* Row for Port Number */}
            <tr>
              <td>Port number:</td>
              <td>{touchstone.nports ?? 'N/A'}</td>
            </tr>

            {/* Row for Parameter */}
            <tr>
              <td>Parameter:</td>
              <td>{touchstone.parameter ?? 'N/A'}</td>
            </tr>

            {/* Row for Frequency Unit Editor */}
            <tr>
              <td>
                <label>Frequency unit:</label>
              </td>
              <td>
                <FrequencyUnitEditor
                  currentUnit={touchstone.frequency?.unit}
                  onUnitChange={setUnit}
                  disabled={!touchstone.frequency}
                />
              </td>
            </tr>

            {/* Row for Data Format Editor */}
            <tr>
              <td>Format:</td>
              <td>
                <DataFormatEditor
                  currentFormat={touchstone.format}
                  onFormatChange={setFormat}
                  disabled={!touchstone.format}
                />
              </td>
            </tr>

            {/* Row for Impedance Editor */}
            <tr>
              <td>Impedance (Ohms):</td>
              <td>
                <ImpedanceEditor
                  currentImpedance={touchstone.impedance}
                  onImpedanceChange={setImpedance}
                />
              </td>
            </tr>

            {/* Row for Comments Editor */}
            <tr>
              <td>Comments:</td>
              <td>
                <CommentsEditor
                  currentComments={touchstone.comments || []}
                  onCommentsChange={setComments}
                />
              </td>
            </tr>

            {/* Row for Data Table (spans two columns) */}
            <tr>
              <td>Network matrix:</td>
              <td>
                <DataTable
                  touchstone={touchstone}
                  filename={filename} // For CSV download naming
                  updateMatrixFrequency={updateMatrixFrequency} // For CSV upload to update matrix/frequencies
                />
              </td>
            </tr>
          </>
        )}
      </tbody>
    </table>
  )
}

export default TouchstoneViewer

/**
 * Extracts a filename from a URL string.
 * It takes the part of the string after the last '/' character.
 * If no '/' is found, the original string is returned.
 * @param url The URL string.
 * @returns The extracted filename or the original URL if no path is present.
 */
const getFilenameFromUrl = (url: string): string => {
  const lastSlash = url.lastIndexOf('/')
  return lastSlash !== -1 ? url.substring(lastSlash + 1) : url
}

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
 * @param url The URL of the Touchstone file to load.
 * @returns A Promise that resolves to a Touchstone object.
 * @throws An error if fetching or parsing fails.
 */
const readUrl = async (url: string): Promise<Touchstone> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.statusText}`)
  }
  const textContent = await response.text()
  const filenameForPortCheck = getFilenameFromUrl(url)
  const nports = getNumberOfPorts(filenameForPortCheck)
  if (nports === null) {
    throw new Error(
      `Could not determine number of ports from file name: ${filenameForPortCheck} (derived from URL: ${url})`
    )
  }
  return readText(textContent, nports)
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
        const nports = getNumberOfPorts(file.name)
        if (nports === null) {
          reject(
            new Error(
              `Could not determine number of ports from file name: ${file.name}`
            )
          )
          return
        }
        resolve(readText(textContent, nports))
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
  const ts = new Touchstone()
  ts.readContent(textContent, nports)
  return ts
}
