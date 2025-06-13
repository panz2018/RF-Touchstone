import React, { useState, useEffect } from 'react'
import {
  complex,
  Complex,
  Frequency,
  Touchstone,
  abs, // Add this
  arg, // Add this
  type TouchstoneFormat, // Add this
} from 'rf-touchstone'
import FileInfo from './components/FileInfo'
import DataTable from './components/DataTable'

const TouchstoneViewer: React.FC = () => {
  const [touchstone, setTouchstone] = useState<Touchstone | null>(null);
  const [unit, setUnit] = useState<string | undefined>();
  const [format, setFormat] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>('sample.s2p') // Default sample file
  const [copyStatus, setCopyStatus] = useState<string>('')

  // Helper function to determine the number of ports from the file extension
  const getNumberOfPorts = (fileName: string): number | null => {
    const match = fileName.match(/\.s(\d+)p$/i)
    if (match && match[1]) {
      return parseInt(match[1], 10)
    }
    return null // Or handle other extensions if needed
  }

  // Wrapped loadFileContent in useCallback to stabilize its identity
  const loadFileContent = React.useCallback(async (fileUrl: string) => {
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
      // setSelectedFrequencyUnit(ts.frequency?.unit); // Handled by useEffect
      // setSelectedFormat(ts.format); // Handled by useEffect
      setError(null)
    } catch (err) {
      console.error('Error loading or parsing Touchstone file:', err)
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred.'
      )
      setTouchstone(null)
    }
  }, []) // Empty dependency array means this function is created once

  useEffect(() => {
    // Load default file on initial mount if fileName is set (which it is by default)
    // This replaces the logic that depended on initialTouchstoneData
    if (fileName) { // Check if fileName is set to avoid issues if it were dynamic
        loadFileContent(`/${fileName}`);
    }
    // loadFileContent is memoized with useCallback, safe for deps array
    // fileName is also in deps array, so if it changes (e.g. programmatically, though not current use case for default load), it re-runs
  }, [fileName, loadFileContent]);

  useEffect(() => {
    if (touchstone) {
      setUnit(touchstone.frequency?.unit);
      setFormat(touchstone.format);
    }
  }, [touchstone])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setFileName(file.name)
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
            setError(null)
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
          setTouchstone(null)
        }
      }
      reader.onerror = () => {
        setError('Error reading file.')
        setTouchstone(null)
      }
      reader.readAsText(file)
    }
  }

  const formatParameter = (
    param: Complex | undefined,
    format: string | undefined
  ): { value1: string; value2: string; unit1: string; unit2: string } => {
    if (!param || format === undefined) {
      return { value1: 'N/A', value2: 'N/A', unit1: '', unit2: '' }
    }
    switch (format) {
      case 'RI':
        return {
          value1: (param.re as unknown as number).toFixed(4),
          value2: (param.im as unknown as number).toFixed(4),
          unit1: 'Real',
          unit2: 'Imaginary',
        }
      case 'MA':
        const magnitude = abs(param) as unknown as number;
        const angle = (arg(param) * 180) / Math.PI;
        return {
          value1: magnitude.toFixed(4),
          value2: angle.toFixed(4),
          unit1: 'Magnitude',
          unit2: 'Angle (°)',
        }
      case 'DB':
        const db = 20 * Math.log10(abs(param) as unknown as number);
        const dbAngle = (arg(param) * 180) / Math.PI;
        return {
          value1: db.toFixed(4),
          value2: dbAngle.toFixed(4),
          unit1: 'dB',
          unit2: 'Angle (°)',
        }
      default:
        return { value1: 'N/A', value2: 'N/A', unit1: '', unit2: '' }
    }
  }

  const handleUnitChange = (newUnit: string) => {
    if (touchstone?.frequency) {
      // Get current frequencies in Hz to serve as a clean baseline
      const frequenciesInHz = touchstone.frequency.f_Hz;

      const updatedTouchstone = new Touchstone();
      Object.assign(updatedTouchstone, touchstone); // Copy other Touchstone properties

      const newFrequency = new Frequency();
      // Set the base frequencies using the f_Hz setter from the rf-touchstone library.
      // This ensures the newFrequency object internally has the values in Hz
      // before the target unit is applied.
      newFrequency.f_Hz = frequenciesInHz;

      // Now set the desired unit. The Frequency class's 'unit' setter will scale
      // the internal Hz values to the newUnit.
      newFrequency.unit = newUnit as any;

      updatedTouchstone.frequency = newFrequency;
      setTouchstone(updatedTouchstone);
      // setSelectedFrequencyUnit(newUnit); // Handled by useEffect
    }
  }

  const handleFormatChange = (newFormat: string) => {
    if (touchstone) {
      const updatedTouchstone = new Touchstone()
      Object.assign(updatedTouchstone, touchstone)
      updatedTouchstone.format = newFormat as TouchstoneFormat;
      setTouchstone(updatedTouchstone)
      // setSelectedFormat(newFormat); // Handled by useEffect
    }
  }

  const handleCopyData = async () => {
    if (!touchstone) {
      setCopyStatus('No data to copy.')
      setTimeout(() => setCopyStatus(''), 3000)
      return
    }

    try {
      // Assuming touchstoneData.toString() serializes the data correctly.
      // This is a critical assumption based on the subtask description.
      // If rf-touchstone's Touchstone class doesn't have a direct toString()
      // for file content, this part would need significant rework
      // to manually reconstruct the file string.
      const fileContentString = touchstone.toString()
      await navigator.clipboard.writeText(fileContentString)
      setCopyStatus('Copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy data:', err)
      setCopyStatus('Failed to copy.')
    } finally {
      setTimeout(() => setCopyStatus(''), 3000) // Clear status after 3 seconds
    }
  }

  const handleDownloadFile = () => {
    if (!touchstone) {
      // Optionally, set a status or log, but button should be disabled
      console.warn('No data to download.')
      return
    }

    try {
      // Assuming touchstone.toString() serializes the data correctly.
      const fileContentString = touchstone.toString()
      const blob = new Blob([fileContentString], {
        type: 'text/plain;charset=utf-8',
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName || `data.s${touchstone.nports || ''}p` // Use existing fileName or a default
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to download file:', err)
      // Optionally, set a status message for the user
    }
  }

  return (
    <div>
      <h2>Touchstone File Viewer</h2>
      <div>
        <label htmlFor="fileInput">Upload a Touchstone file (.sNp): </label>
        <input
          type="file"
          id="fileInput"
          accept=".s1p,.s2p,.s3p,.s4p,.s5p,.s6p,.s7p,.s8p,.s9p,.s10p,.s11p,.s12p,.s13p,.s14p,.s15p,.s16p,.s17p,.s18p,.s19p,.s20p"
          onChange={handleFileChange}
        />
      </div>
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
      <p>
        Currently displaying:{' '}
        {touchstone
          ? `Data from ${fileName}`
          : error
          ? `Error with ${fileName}`
          : `Loading ${fileName}...`}
      </p>

      {error && <pre style={{ color: 'red' }}>Error: {error}</pre>}

      {touchstone && (
        <>
          <FileInfo
            touchstone={touchstone}
            unit={unit}
            handleUnitChange={handleUnitChange}
            format={format}
            handleFormatChange={handleFormatChange}
          />
          <DataTable
            touchstone={touchstone}
            formatParameter={formatParameter}
          />
        </>
      )}
    </div>
  )
}

export default TouchstoneViewer
