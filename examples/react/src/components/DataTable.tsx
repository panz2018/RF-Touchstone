import React, { JSX } from 'react'
import type { TouchstoneMatrix } from 'rf-touchstone'
import { Touchstone, abs, arg } from 'rf-touchstone'

/**
 * Props for the DataTable component.
 */
interface DataTableProps {
  /** The loaded Touchstone data object, or null if no data is available or an error occurred. */
  touchstone: Touchstone | null
  /** The current base filename (without extension) for CSV downloads. */
  filename: string
  /** Callback to update the matrix and frequencies in the parent component when a CSV is uploaded. */
  updateMatrixFrequency: (
    matrix: TouchstoneMatrix,
    frequencies: number[]
  ) => void
}

/**
 * DataTable component.
 * Renders Touchstone network parameter data in a table and provides CSV import/export functionality.
 * Unit and format for display and CSV operations are derived from the `touchstone` object.
 */
const DataTable: React.FC<DataTableProps> = ({
  touchstone,
  filename,
  updateMatrixFrequency,
}) => {
  // Derive unit and format from the touchstone object for display purposes.
  const unit = touchstone?.frequency?.unit
  const format = touchstone?.format

  const handleDownloadCsvInternal = () => {
    if (!touchstone) return

    const currentUnit = touchstone.frequency?.unit
    const currentFormat = touchstone.format

    // 1. Get Headers
    const headerParts: string[] = []
    headerParts.push(`Frequency (${currentUnit || 'N/A'})`)
    if (touchstone.nports !== undefined) {
      const units = getUnitNames(currentFormat)
      for (let outPort = 0; outPort < touchstone.nports!; outPort++) {
        for (let inPort = 0; inPort < touchstone.nports!; inPort++) {
          const paramName = `${touchstone.parameter || 'S'}${outPort + 1}${inPort + 1}`
          headerParts.push(`${paramName} (${units.unit1})`)
          headerParts.push(`${paramName} (${units.unit2})`)
        }
      }
    }
    const csvHeader = headerParts.join(',') + '\n'

    // 2. Get Data Rows (with full precision)
    let csvRows = ''
    if (touchstone.matrix && touchstone.frequency?.f_scaled) {
      touchstone.frequency.f_scaled.forEach((freq, freqIndex) => {
        const rowData: string[] = []
        rowData.push(freq.toString()) // Full precision for frequency

        if (touchstone.nports !== undefined) {
          for (let outPort = 0; outPort < touchstone.nports!; outPort++) {
            for (let inPort = 0; inPort < touchstone.nports!; inPort++) {
              const param = touchstone.matrix?.[outPort]?.[inPort]?.[freqIndex]
              // Use currentFormat derived from touchstone for formatting
              const values = formatDataValues(param, currentFormat, -1) // -1 for full precision
              rowData.push(values.value1)
              rowData.push(values.value2)
            }
          }
        }
        csvRows += rowData.join(',') + '\n'
      })
    }

    const csvContent = csvHeader + csvRows
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const blobUrl = URL.createObjectURL(blob)
    link.setAttribute('href', blobUrl)
    // Use the filename prop passed from TouchstoneViewer
    const csvFilename =
      (filename
        ? filename.substring(0, filename.lastIndexOf('.')) || filename
        : 'data') + '.csv'
    link.setAttribute('download', csvFilename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(blobUrl)
  }

  const handleCsvFileSelectInternal = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!touchstone) {
      alert(
        'Cannot upload CSV: No current Touchstone data loaded to provide context (format, unit, ports).'
      )
      if (event.target) event.target.value = '' // Reset file input
      return
    }
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const text = e.target?.result as string
        try {
          const { matrix, frequencies } = parseCSV(text, touchstone)
          updateMatrixFrequency(matrix, frequencies)
        } catch (error) {
          console.error('Error parsing CSV:', error)
          alert(
            `Error parsing CSV: ${error instanceof Error ? error.message : String(error)}`
          )
        } finally {
          if (event.target) event.target.value = '' // Reset file input
        }
      }
      reader.onerror = () => {
        console.error('Error reading CSV file.')
        alert('Error reading CSV file.')
        if (event.target) event.target.value = '' // Reset file input
      }
      reader.readAsText(file)
    }
  }

  if (
    !touchstone ||
    !touchstone.matrix ||
    touchstone.matrix.length === 0 ||
    !touchstone.frequency?.f_scaled ||
    touchstone.frequency.f_scaled.length === 0
  ) {
    return (
      <p>
        No network data available or data format is not supported for display.
      </p>
    )
  }

  return (
    <div style={{ marginTop: '20px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px',
        }}
      >
        <div>
          <input
            type="file"
            accept=".csv"
            onChange={handleCsvFileSelectInternal} // Use internal handler
            style={{ display: 'none' }}
            id="csvUploadInput"
          />
          <label
            htmlFor="csvUploadInput"
            className="csv-button"
            style={{
              marginRight: '10px',
              cursor: 'pointer',
              padding: '5px 10px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              backgroundColor: '#f0f0f0',
            }}
          >
            Upload CSV
          </label>
          <button
            className="prime-button"
            onClick={handleDownloadCsvInternal}
            disabled={!touchstone}
          >
            Download CSV
          </button>
        </div>
      </div>
      <div
        className="dataTableContainer"
        style={{
          maxHeight: '500px',
          overflow: 'auto',
          border: '1px solid #ccc',
        }}
      >
        <table>
          <thead>{renderTableHeaders(touchstone, unit, format)}</thead>
          <tbody>{renderTableRows(touchstone, format)}</tbody>
        </table>
      </div>
    </div>
  )
}

/**
 * Parses a CSV string into a data structure for updating a Touchstone object's matrix and frequencies.
 * Assumes the CSV format matches the current display format, unit, and nports of `currentTouchstone`.
 * @param csvString The raw CSV string content.
 * @param currentTouchstone The current Touchstone object, used as a template for expected format.
 * @returns An object containing the parsed `matrix` and `frequencies`.
 * @throws If CSV headers are mismatched, data rows have incorrect value counts, or data is non-numeric.
 */
const parseCSV = (
  csvString: string,
  currentTouchstone: Touchstone
): { matrix: Complex[][][]; frequencies: number[] } => {
  const lines = csvString.trim().split('\n')
  if (lines.length < 2) {
    throw new Error('CSV must have at least a header and one data row.')
  }

  const headerLine = lines[0].trim()
  const dataLines = lines
    .slice(1)
    .map((line) => line.trim())
    .filter((line) => line)

  const currentFormat = currentTouchstone.format
  const currentUnit = currentTouchstone.frequency.unit
  const nports = currentTouchstone.nports

  // --- Validate Headers ---
  const actualHeaders = headerLine.split(',')
  const expectedHeaderParts: string[] = []
  expectedHeaderParts.push(`Frequency (${currentUnit})`)
  const sParamUnits = getUnitNames(currentFormat)

  for (let outPort = 1; outPort <= nports; outPort++) {
    for (let inPort = 1; inPort <= nports; inPort++) {
      const paramName = `${currentTouchstone.parameter || 'S'}${outPort}${inPort}`
      expectedHeaderParts.push(`${paramName} (${sParamUnits.unit1})`)
      expectedHeaderParts.push(`${paramName} (${sParamUnits.unit2})`)
    }
  }

  if (actualHeaders.length !== expectedHeaderParts.length) {
    throw new Error(
      `CSV header count mismatch. Expected ${expectedHeaderParts.length} columns, got ${actualHeaders.length}.`
    )
  }
  for (let i = 0; i < actualHeaders.length; i++) {
    if (actualHeaders[i].trim() !== expectedHeaderParts[i].trim()) {
      throw new Error(
        `CSV header mismatch at column ${i + 1}. Expected "${expectedHeaderParts[i]}", got "${actualHeaders[i]}".`
      )
    }
  }

  // --- Parse Data Rows ---
  const frequencies: number[] = []
  // Initialize matrix: matrix[outputPortIndex][inputPortIndex][frequencyIndex]
  const matrixData: Complex[][][] = Array(nports)
    .fill(null)
    .map(() =>
      Array(nports)
        .fill(null)
        .map(() => [])
    )

  for (const line of dataLines) {
    const values = line.split(',').map((v) => parseFloat(v.trim()))
    if (values.length !== expectedHeaderParts.length) {
      throw new Error(
        `CSV data row has incorrect number of values. Expected ${expectedHeaderParts.length}, got ${values.length}. Line: "${line}"`
      )
    }
    if (values.slice(1).some(isNaN)) {
      // Check S-param values for NaN
      throw new Error(
        `CSV data row contains non-numeric S-parameter values. Line: "${line}"`
      )
    }
    if (isNaN(values[0])) {
      // Check frequency value for NaN
      throw new Error(
        `CSV data row contains non-numeric frequency value. Line: "${line}"`
      )
    }

    frequencies.push(values[0]) // Frequency is in currentUnit

    let valIdx = 1
    for (let outPortIdx = 0; outPortIdx < nports; outPortIdx++) {
      for (let inPortIdx = 0; inPortIdx < nports; inPortIdx++) {
        const val1 = values[valIdx++]
        const val2 = values[valIdx++]
        let re = 0,
          im = 0

        switch (currentFormat) {
          case 'RI':
            re = val1
            im = val2
            break
          case 'MA':
            const angleRadMA = (val2 * Math.PI) / 180
            re = val1 * Math.cos(angleRadMA)
            im = val1 * Math.sin(angleRadMA)
            break
          case 'DB':
            const magnitudeDB = Math.pow(10, val1 / 20)
            const angleRadDB = (val2 * Math.PI) / 180
            re = magnitudeDB * Math.cos(angleRadDB)
            im = magnitudeDB * Math.sin(angleRadDB)
            break
          default:
            throw new Error(
              `Unsupported format for CSV parsing: ${currentFormat}`
            )
        }
        matrixData[outPortIdx][inPortIdx].push(new Complex(re, im))
      }
    }
  }
  return { matrix: matrixData, frequencies }
}

export default DataTable

/**
 * Determines the unit names for the two parts of a formatted data value based on the display format.
 * @param format The current display format string (e.g., 'RI', 'MA', 'DB').
 * @returns An object with `unit1` and `unit2` string properties.
 */
const getUnitNames = (
  format: string | undefined
): { unit1: string; unit2: string } => {
  if (format === undefined) {
    return { unit1: 'N/A', unit2: 'N/A' }
  }
  switch (format) {
    case 'RI':
      return { unit1: 'Real', unit2: 'Imaginary' }
    case 'MA':
      return { unit1: 'Magnitude', unit2: 'Angle (°)' }
    case 'DB':
      return { unit1: 'dB', unit2: 'Angle (°)' }
    default:
      return { unit1: 'N/A', unit2: 'N/A' }
  }
}

/**
 * Formats the numerical values of a complex data parameter based on the display format.
 * @param param The complex data parameter value (or undefined).
 * @param format The current display format string (e.g., 'RI', 'MA', 'DB').
 * @param precision The number of decimal places for `toFixed`. If -1, use full precision (convert to string).
 * @returns An object with `value1` and `value2` string properties (formatted numbers).
 */
const formatDataValues = (
  param: Complex | undefined,
  format: string | undefined,
  precision: number = 4
): { value1: string; value2: string } => {
  if (!param || format === undefined) {
    return { value1: 'N/A', value2: 'N/A' }
  }

  const formatNumber = (num: number): string => {
    return precision === -1 ? num.toString() : num.toFixed(precision)
  }

  switch (format) {
    case 'RI':
      return {
        value1: formatNumber(param.re as unknown as number),
        value2: formatNumber(param.im as unknown as number),
      }
    case 'MA':
      const magnitude = abs(param) as unknown as number
      const angle = (arg(param) * 180) / Math.PI
      return {
        value1: formatNumber(magnitude),
        value2: formatNumber(angle),
      }
    case 'DB':
      const dbValue = 20 * Math.log10(abs(param) as unknown as number)
      const dbAngle = (arg(param) * 180) / Math.PI
      return {
        value1: formatNumber(dbValue),
        value2: formatNumber(dbAngle),
      }
    default:
      return { value1: 'N/A', value2: 'N/A' }
  }
}

/**
 * Module-level function to generate the table header row (<thead>).
 * The first column is always "Frequency" with its current unit.
 * Subsequent columns are for S-parameters, consistently named S<OutputPort><InputPort>
 * (e.g., S11, S21), with sub-headers indicating the two parts of the complex value
 * (e.g., Real/Imaginary) based on the selected format.
 * @param touchstone The active Touchstone object.
 * @param unit The currently selected frequency unit for the header.
 * @param format The currently selected S-parameter display format.
 * @returns A JSX.Element representing the table header row (<tr>).
 */
const renderTableHeaders = (
  touchstone: Touchstone,
  unit: string | undefined,
  format: string | undefined
): JSX.Element => {
  const headers: JSX.Element[] = []
  // The first header column displays the frequency and its current unit.
  headers.push(
    <th key="frequency">
      Frequency ({unit || touchstone.frequency?.unit || 'N/A'})
    </th>
  )

  // Dynamically generate headers for each S-parameter based on the number of ports.
  if (touchstone.nports !== undefined) {
    const units = getUnitNames(format)
    for (let outPort = 0; outPort < touchstone.nports!; outPort++) {
      for (let inPort = 0; inPort < touchstone.nports!; inPort++) {
        // Standard S-parameter naming: S<OutputPort><InputPort>
        // e.g., S21 means OutputPort=2, InputPort=1.
        // Loop iterates outPort first, then inPort.
        const paramName = `${touchstone.parameter || 'S'}${outPort + 1}${inPort + 1}`

        headers.push(
          <th key={`header-${outPort}-${inPort}-1`}>
            {paramName} ({units.unit1})
          </th>
        )
        headers.push(
          <th key={`header-${outPort}-${inPort}-2`}>
            {paramName} ({units.unit2})
          </th>
        )
      }
    }
  }
  return <tr>{headers}</tr>
}

/**
 * Module-level function to generate the table body rows (<tbody>).
 * Each row corresponds to a frequency point from the Touchstone data.
 * Parameter values are formatted using the `formatDataValues` function
 * based on the provided `format` argument (derived from `touchstone.format` by the caller).
 * The rf-touchstone library normalizes 2-port data upon parsing,
 * so matrix access is consistently matrix[outPort][inPort] for S<OutputPort><InputPort>.
 * @param touchstone The active Touchstone object.
 * @param format The S-parameter display format to use (e.g., 'RI', 'MA', 'DB').
 * @returns A React.Fragment containing all table data rows (<tr> elements).
 */
const renderTableRows = (
  touchstone: Touchstone,
  format: string | undefined
): JSX.Element => {
  const rows: JSX.Element[] = []

  if (touchstone.matrix && touchstone.frequency?.f_scaled) {
    touchstone.frequency.f_scaled.forEach((freq, freqIndex) => {
      const dataCells: JSX.Element[] = []
      dataCells.push(<td key={`freq-${freqIndex}`}>{freq.toFixed(4)}</td>)

      if (touchstone.nports !== undefined) {
        for (let outPort = 0; outPort < touchstone.nports!; outPort++) {
          for (let inPort = 0; inPort < touchstone.nports!; inPort++) {
            // Consistently access matrix using [outPort][inPort]
            // The rf-touchstone library handles normalization of 2-port files
            // to match this S<OutputPort><InputPort> iteration order.
            const param = touchstone.matrix?.[outPort]?.[inPort]?.[freqIndex]

            const values = formatDataValues(param, format)

            dataCells.push(
              <td key={`data-${outPort}-${inPort}-${freqIndex}-1`}>
                {values.value1}
              </td>
            )
            dataCells.push(
              <td key={`data-${outPort}-${inPort}-${freqIndex}-2`}>
                {values.value2}
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
