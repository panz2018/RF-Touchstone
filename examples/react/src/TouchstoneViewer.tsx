import React, { useState, useEffect, JSX } from 'react'
import {
  complex,
  Complex,
  Frequency,
  FrequencyUnits,
  Touchstone,
} from 'rf-touchstone'

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
  >(touchstoneData?.frequency?.unit)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>('sample.s2p') // Default sample file

  // Helper function to determine the number of ports from the file extension
  const getNumberOfPorts = (fileName: string): number | null => {
    const match = fileName.match(/\.s(\d+)p$/i)
    if (match && match[1]) {
      return parseInt(match[1], 10)
    }
    return null // Or handle other extensions if needed
  }

  const loadFileContent = async (fileUrl: string) => {
    try {
      const response = await fetch(fileUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`)
      }
      const textContent = await response.text()

      // Determine the number of ports from the file name
      const nports = getNumberOfPorts(fileUrl)
      if (nports === null) {
        throw new Error(
          `Could not determine number of ports from file name: ${fileUrl}`
        )
      }

      const ts = new Touchstone() // Create an instance
      ts.readContent(textContent, nports)
      setTouchstoneData(ts)
      setError(null)
    } catch (err) {
      console.error('Error loading or parsing Touchstone file:', err)
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred.'
      )
      setTouchstoneData(null)
    }
  }

  useEffect(() => {
    // Only load default file if initialTouchstoneData is not provided
    if (!initialTouchstoneData) {
      // Load the default sample file on component mount
      // Ensure the file name used here is correct for determining ports
      // You might need to adjust the path based on where sample files are served in your React app
      loadFileContent(`/${fileName}`)
    } else {
      setTouchstoneData(initialTouchstoneData)
      // We no longer set selectedFrequencyUnit here
    }
  }, [fileName, initialTouchstoneData, loadFileContent]) // Remove touchstoneData from dependency array

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setFileName(file.name) // Keep track of the name for display or other purposes
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const textContent = e.target?.result as string
          if (textContent) {
            // Determine the number of ports from the uploaded file name
            const nports = getNumberOfPorts(file.name)
            if (nports === null) {
              throw new Error(
                `Could not determine number of ports from file name: ${file.name}`
              )
            }

            const ts = new Touchstone() // Create an instance
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

  // Helper function to format parameter data based on Touchstone format
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
      // Create a copy of the touchstoneData to avoid mutating state directly
      const updatedTouchstoneData = new Touchstone()
      // Copy all existing properties except frequency
      Object.assign(updatedTouchstoneData, touchstoneData)

      // Create a NEW Frequency object
      const newFrequency = new Frequency()
      // Copy the scaled frequency data from the original frequency object
      // Assuming f_scaled contains the original data in the *previous* unit
      newFrequency.f_scaled = touchstoneData.frequency.f_scaled

      // Set the new unit on the NEW Frequency object
      // This will trigger the automatic scaling of f_scaled within newFrequency
      newFrequency.unit = newUnit as any // Use 'as any' temporarily if type mismatch

      // Update the touchstoneData with the NEW Frequency object
      updatedTouchstoneData.frequency = newFrequency

      setTouchstoneData(updatedTouchstoneData)
      setSelectedFrequencyUnit(newUnit)
    }
  }

  // Helper function to render table headers
  const renderTableHeaders = (touchstoneData: Touchstone) => {
    const headers: JSX.Element[] = []
    headers.push(
      <th key="frequency">Frequency ({touchstoneData.frequency?.unit})</th>
    )

    if (touchstoneData.nports !== undefined) {
      for (let outPort = 0; outPort < touchstoneData.nports!; outPort++) {
        for (let inPort = 0; inPort < touchstoneData.nports!; inPort++) {
          let paramName
          if (touchstoneData.nports === 2) {
            paramName = `${touchstoneData.parameter || 'S'}${inPort + 1}${outPort + 1}`
          } else {
            paramName = `${touchstoneData.parameter || 'S'}${outPort + 1}${inPort + 1}`
          }

          const placeholderParam = complex(0, 0) // Placeholder for unit determination
          const formattedHeader = formatParameter(
            placeholderParam,
            touchstoneData.format
          )

          headers.push(
            <th key={`header-${outPort}-${inPort}-1`}>
              {paramName} ({formattedHeader.unit1})
            </th>
          )
          headers.push(
            <th key={`header-${outPort}-${inPort}-2`}>
              {paramName} ({formattedHeader.unit2})
            </th>
          )
        }
      }
    }

    return <tr>{headers}</tr>
  }
  // Helper function to render table data rows
  const renderTableRows = (touchstoneData: Touchstone) => {
    const rows: JSX.Element[] = []

    if (touchstoneData.matrix && touchstoneData.frequency?.f_scaled) {
      // Use touchstoneData.frequency.f_scaled directly as it's updated by the unit setter
      touchstoneData.frequency.f_scaled.forEach((freq, freqIndex) => {
        // Use touchstoneData.frequency.f_scaled here
        const dataCells: JSX.Element[] = []
        dataCells.push(<td key={`freq-${freqIndex}`}>{freq.toFixed(4)}</td>)

        if (touchstoneData.nports !== undefined) {
          for (let outPort = 0; outPort < touchstoneData.nports!; outPort++) {
            for (let inPort = 0; inPort < touchstoneData.nports!; inPort++) {
              const param =
                touchstoneData.matrix?.[outPort]?.[inPort]?.[freqIndex]
              const formatted = formatParameter(param, touchstoneData.format)
              dataCells.push(
                <td key={`data-${outPort}-${inPort}-${freqIndex}-1`}>
                  {formatted.value1}
                </td>
              )
              dataCells.push(
                <td key={`data-${outPort}-${inPort}-${freqIndex}-2`}>
                  {formatted.value2}
                </td>
              )
            }
          }
        }
        rows.push(<tr key={freqIndex}>{dataCells}</tr>)
      })
    }

    return <>{rows}</>
  }

  return (
    <div>
      <h2>Touchstone File Viewer</h2>
      <div>
        <label htmlFor="fileInput">Upload a Touchstone file (.sNp): </label>
        <input
          type="file"
          id="fileInput"
          accept=".s1p,.s2p,.s3p,.s4p,.s5p,.s6p,.s7p,.s8p,.s9p,.s10p,.s11p,.s12p,.s13p,.s14p,.s15p,.s16p,.s17p,.s18p,.s19p,.s20p" // Added more .sNp extensions
          onChange={handleFileChange}
        />
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
        <div>
          <h3>File Information</h3>
          <p>
            <strong>Port number:</strong> {touchstoneData.nports}
          </p>
          <p>
            <strong>Frequency Unit:</strong>{' '}
            {touchstoneData?.frequency?.unit ? (
              <select
                value={selectedFrequencyUnit}
                onChange={(e) => {
                  setSelectedFrequencyUnit(e.target.value)
                  // Call a function to handle the frequency unit change
                  handleFrequencyUnitChange(e.target.value)
                }}
              >
                {FrequencyUnits.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            ) : (
              'N/A'
            )}
          </p>
          <p>
            <strong>Parameter:</strong> {touchstoneData.parameter}
          </p>
          <p>
            <strong>Format:</strong> {touchstoneData.format}
          </p>
          <p>
            <strong>Impedance:</strong>{' '}
            {Array.isArray(touchstoneData.impedance)
              ? touchstoneData.impedance.join(', ')
              : touchstoneData.impedance}{' '}
            Ohms
          </p>
          {touchstoneData.comments.length > 0 && (
            <div>
              <strong>Comments:</strong>
              <ul>
                {touchstoneData.comments.map((comment, index) => (
                  <li key={index}>{comment}</li>
                ))}
              </ul>
            </div>
          )}

          <h3>Network Data</h3>
          {touchstoneData.matrix &&
          touchstoneData.matrix.length > 0 &&
          touchstoneData.frequency?.f_scaled &&
          touchstoneData.frequency.f_scaled.length > 0 ? (
            <table>
              <thead>{renderTableHeaders(touchstoneData)}</thead>
              <tbody>{renderTableRows(touchstoneData)}</tbody>
            </table>
          ) : (
            <p>
              No network data available or data format is not supported for
              display.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default TouchstoneViewer
