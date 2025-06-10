import React, { useState, useEffect } from 'react'
import {
  complex,
  Complex,
  Frequency,
  // FrequencyUnits, // No longer needed here, moved to FileInfo
  Touchstone,
} from 'rf-touchstone'
import FileInfo from './components/FileInfo'
import DataTable from './components/DataTable'

interface TouchstoneViewerProps {
  touchstoneData: Touchstone | null
}

const TouchstoneViewer: React.FC<TouchstoneViewerProps> = ({
  touchstoneData: initialTouchstoneData,
}) => {
  const [touchstoneData, setTouchstoneData] = useState<Touchstone | null>(
    initialTouchstoneData
  )
  const [selectedFrequencyUnit, setSelectedFrequencyUnit] = useState<
    string | undefined
  >()
  const [selectedFormat, setSelectedFormat] = useState<string | undefined>()
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
      setTouchstoneData(ts)
      // setSelectedFrequencyUnit(ts.frequency?.unit); // Handled by useEffect
      // setSelectedFormat(ts.format); // Handled by useEffect
      setError(null)
    } catch (err) {
      console.error('Error loading or parsing Touchstone file:', err)
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred.'
      )
      setTouchstoneData(null)
    }
  }, []) // Empty dependency array means this function is created once

  useEffect(() => {
    if (!initialTouchstoneData) {
      loadFileContent(`/${fileName}`)
    } else {
      setTouchstoneData(initialTouchstoneData)
      // setSelectedFrequencyUnit(initialTouchstoneData.frequency?.unit); // Handled by another useEffect
      // setSelectedFormat(initialTouchstoneData.format); // Handled by another useEffect
    }
  }, [fileName, initialTouchstoneData, loadFileContent])

  useEffect(() => {
    if (touchstoneData) {
      setSelectedFrequencyUnit(touchstoneData.frequency?.unit)
      setSelectedFormat(touchstoneData.format)
    }
  }, [touchstoneData])

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
            setTouchstoneData(ts)
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
          setTouchstoneData(null)
        }
      }
      reader.onerror = () => {
        setError('Error reading file.')
        setTouchstoneData(null)
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
          value1: param.re.toFixed(4),
          value2: param.im.toFixed(4),
          unit1: 'Real',
          unit2: 'Imaginary',
        }
      case 'MA':
        const magnitude = param.abs()
        const angle = (param.arg() * 180) / Math.PI
        return {
          value1: magnitude.toFixed(4),
          value2: angle.toFixed(4),
          unit1: 'Magnitude',
          unit2: 'Angle (°)',
        }
      case 'DB':
        const db = 20 * Math.log10(param.abs())
        const dbAngle = (param.arg() * 180) / Math.PI
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

  const handleFrequencyUnitChange = (newUnit: string) => {
    if (touchstoneData?.frequency) {
      const updatedTouchstoneData = new Touchstone()
      Object.assign(updatedTouchstoneData, touchstoneData)
      const newFrequency = new Frequency()
      newFrequency.f_scaled = touchstoneData.frequency.f_scaled
      newFrequency.unit = newUnit as any
      updatedTouchstoneData.frequency = newFrequency
      setTouchstoneData(updatedTouchstoneData)
      // setSelectedFrequencyUnit(newUnit); // Handled by useEffect
    }
  }

  const handleFormatChange = (newFormat: string) => {
    if (touchstoneData) {
      const updatedTouchstoneData = new Touchstone()
      Object.assign(updatedTouchstoneData, touchstoneData)
      updatedTouchstoneData.format = newFormat
      setTouchstoneData(updatedTouchstoneData)
      // setSelectedFormat(newFormat); // Handled by useEffect
    }
  }

  const handleCopyData = async () => {
    if (!touchstoneData) {
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
      const fileContentString = touchstoneData.toString()
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
    if (!touchstoneData) {
      // Optionally, set a status or log, but button should be disabled
      console.warn('No data to download.')
      return
    }

    try {
      // Assuming touchstoneData.toString() serializes the data correctly.
      const fileContentString = touchstoneData.toString()
      const blob = new Blob([fileContentString], {
        type: 'text/plain;charset=utf-8',
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName || `data.s${touchstoneData.nports || ''}p` // Use existing fileName or a default
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
        <button onClick={handleCopyData} disabled={!touchstoneData}>
          Copy Data
        </button>
        <button
          onClick={handleDownloadFile}
          disabled={!touchstoneData}
          style={{ marginLeft: '10px' }}
        >
          Download File
        </button>
        {copyStatus && <span style={{ marginLeft: '10px' }}>{copyStatus}</span>}
      </div>
      <p>
        Currently displaying:{' '}
        {touchstoneData
          ? `Data from ${fileName}`
          : error
          ? `Error with ${fileName}`
          : `Loading ${fileName}...`}
      </p>

      {error && <pre style={{ color: 'red' }}>Error: {error}</pre>}

      {touchstoneData && (
        <>
          <FileInfo
            touchstoneData={touchstoneData}
            selectedFrequencyUnit={selectedFrequencyUnit}
            handleFrequencyUnitChange={handleFrequencyUnitChange}
            selectedFormat={selectedFormat}
            handleFormatChange={handleFormatChange}
          />
          <DataTable
            touchstoneData={touchstoneData}
            formatParameter={formatParameter}
          />
        </>
      )}
    </div>
  )
}

export default TouchstoneViewer
