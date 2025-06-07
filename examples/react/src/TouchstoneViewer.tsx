import React, { useState, useEffect } from 'react'
import { Touchstone } from 'rf-touchstone' // Assuming rf-touchstone is correctly imported

const TouchstoneViewer: React.FC = () => {
  const [touchstoneData, setTouchstoneData] = useState<Touchstone | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>('sample.s2p') // Default sample file

  // Helper function to determine the number of ports from the file extension
  const getNumberOfPorts = (fileName: string): number | null => {
    const match = fileName.match(/\.s(\d+)p$/i)
    if (match && match[1]) {
      return parseInt(match[1], 10)
    }
    return null // Or throw an error if the format is unexpected
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
      ts.readContent(textContent, nports) // Use readContent
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
    // Load the default sample file on component mount
    // Ensure the file name used here is correct for determining ports
    loadFileContent(`/${fileName}`)
  }, [fileName]) // Reload if fileName changes (e.g., if we implement file switching)

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
            ts.readContent(textContent, nports) // Use readContent
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

  return (
    <div>
      <h2>Touchstone File Viewer</h2>
      <div>
        <label htmlFor="fileInput">Upload a Touchstone file (.sNp): </label>
        <input
          type="file"
          id="fileInput"
          accept=".s1p,.s2p,.s3p,.sNp" // Note: .sNp is not a real extension, it's a placeholder for .s1p, .s2p, etc.
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
            <strong>Type:</strong> {touchstoneData.type}
          </p>
          <p>
            <strong>Frequency Unit:</strong> {touchstoneData.frequencyUnit}
          </p>
          <p>
            <strong>Parameter:</strong> {touchstoneData.parameter}
          </p>
          <p>
            <strong>Format:</strong> {touchstoneData.format}
          </p>
          <p>
            <strong>Resistance:</strong> {touchstoneData.resistance} Ohms
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
          {/* Display network data - this part of the component seems to be mostly correct based on the Touchstone class structure */}
          {/* You'll need to ensure touchstoneData.networkData and its structure match what you expect */}
          {touchstoneData.networkData &&
          touchstoneData.networkData.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Frequency ({touchstoneData.frequencyUnit})</th>
                  {/* Assuming S-parameters; adjust if other parameters */}
                  {/* You'll need to update this part to correctly iterate through ports and parameters based on the actual matrix structure */}
                  {/* The current logic for generating headers might need adjustment */}
                  {Array.from({ length: touchstoneData.nports || 0 }, (_, i) =>
                    Array.from(
                      { length: touchstoneData.nports || 0 },
                      (_, j) => (
                        <React.Fragment key={`s${i + 1}${j + 1}`}>
                          <th>
                            {touchstoneData.parameter || 'S'}
                            {i + 1}
                            {j + 1} (Magnitude)
                          </th>
                          <th>
                            {touchstoneData.parameter || 'S'}
                            {i + 1}
                            {j + 1} (Angle)
                          </th>
                        </React.Fragment>
                      )
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {/* You'll need to update this part to correctly iterate through the matrix data */}
                {/* The current logic for rendering data rows might need adjustment */}
                {touchstoneData.matrix &&
                  touchstoneData.frequency?.f_scaled.map((freq, freqIndex) => (
                    <tr key={freqIndex}>
                      <td>{freq}</td>
                      {Array.from(
                        { length: touchstoneData.nports || 0 },
                        (_, outPort) =>
                          Array.from(
                            { length: touchstoneData.nports || 0 },
                            (_, inPort) => {
                              const param =
                                touchstoneData.matrix?.[outPort]?.[inPort]?.[
                                  freqIndex
                                ]
                              // Assuming MA format for display magnitude and angle
                              const magnitude = param
                                ? Math.abs(param.re)
                                : 'N/A' // This is a simplified assumption, needs to handle different formats
                              const angle = param
                                ? (Math.arg(param) * 180) / Math.PI
                                : 'N/A' // This is a simplified assumption, needs to handle different formats
                              return (
                                <React.Fragment
                                  key={`data-${outPort}-${inPort}-${freqIndex}`}
                                >
                                  <td>
                                    {typeof magnitude === 'number'
                                      ? magnitude.toFixed(4)
                                      : magnitude}
                                  </td>
                                  <td>
                                    {typeof angle === 'number'
                                      ? angle.toFixed(4)
                                      : angle}
                                  </td>
                                </React.Fragment>
                              )
                            }
                          )
                      )}
                    </tr>
                  ))}
              </tbody>
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
