import React, { JSX } from 'react'
import { Touchstone, Complex, complex, abs, arg } from 'rf-touchstone'

/**
 * Props for the DataTable component.
 */
interface DataTableProps {
  /** The loaded Touchstone data object, or null if no data/error. */
  touchstone: Touchstone | null
  /** The currently selected frequency unit (e.g., "GHz", "MHz") for the frequency column header. */
  unit: string | undefined
  /** The currently selected S-parameter display format ('RI', 'MA', 'DB'). */
  format: string | undefined
}

/**
 * DataTable component.
 * Renders the main table displaying Touchstone network parameter data (e.g., S-parameters).
 * It handles the generation of table headers and rows based on the provided Touchstone object
 * and the selected display format and unit.
 */
const DataTable: React.FC<DataTableProps> = ({
  touchstone,
  unit, // New prop for frequency unit
  format, // New prop for S-parameter format
}) => {
  /**
   * Formats a complex S-parameter value into a displayable string object.
   * Based on the selected format (RI, MA, DB), it returns two string values and their units.
   * This function is now internal to DataTable.
   * @param param The complex S-parameter (or undefined).
   * @param currentFormat The currently selected display format ('RI', 'MA', 'DB').
   * @returns An object with `value1`, `value2`, `unit1`, `unit2`.
   */
  const formatSParameterForDisplay = (
    param: Complex | undefined,
    currentFormat: string | undefined
  ): { value1: string; value2: string; unit1: string; unit2: string } => {
    if (!param || currentFormat === undefined) {
      return { value1: 'N/A', value2: 'N/A', unit1: '', unit2: '' }
    }
    switch (currentFormat) {
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
        const dbVal = 20 * Math.log10(abs(param) as unknown as number); // Renamed variable to avoid conflict
        const dbAngle = (arg(param) * 180) / Math.PI;
        return {
          value1: dbVal.toFixed(4),
          value2: dbAngle.toFixed(4),
          unit1: 'dB',
          unit2: 'Angle (°)',
        }
      default:
        return { value1: 'N/A', value2: 'N/A', unit1: '', unit2: '' }
    }
  }

  // If no Touchstone data, or critical parts of it are missing, display a message.
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

  /**
   * Generates the table header row (<thead>) based on the number of ports
   * and the selected data format, including units for each part of the S-parameter.
   * Uses the `unit` and `format` props for display.
   * @param currentTouchstoneData The Touchstone object containing the data.
   * @returns A JSX.Element representing the table header row (<tr>).
   */
  const renderTableHeaders = (currentTouchstoneData: Touchstone): JSX.Element => {
    const headers: JSX.Element[] = []
    // First column is always Frequency, using the unit prop
    headers.push(
      <th key="frequency">
        Frequency ({unit || currentTouchstoneData.frequency?.unit || 'N/A'})
      </th>
    )

    // Generate headers for each S-parameter
    if (currentTouchstoneData.nports !== undefined) {
      for (
        let outPort = 0;
        outPort < currentTouchstoneData.nports!;
        outPort++
      ) {
        for (
          let inPort = 0;
          inPort < currentTouchstoneData.nports!;
          inPort++
        ) {
          let paramName
          if (currentTouchstoneData.nports === 2) {
            paramName = `${currentTouchstoneData.parameter || 'S'}${inPort + 1}${outPort + 1}`
          } else {
            paramName = `${currentTouchstoneData.parameter || 'S'}${outPort + 1}${inPort + 1}`
          }

          const placeholderParam = complex(0, 0)
          // Use the internal formatting function and the format prop
          const formattedHeader = formatSParameterForDisplay(
            placeholderParam,
            format // Use format prop
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

  /**
   * Generates the table body rows (<tbody>), iterating through each frequency point
   * and formatting the S-parameter data according to the selected format (via the `format` prop).
   * @param currentTouchstoneData The Touchstone object containing the data.
   * @returns A React.Fragment containing all table rows (<tr>).
   */
  const renderTableRows = (currentTouchstoneData: Touchstone): JSX.Element => {
    const rows: JSX.Element[] = []

    if (
      currentTouchstoneData.matrix &&
      currentTouchstoneData.frequency?.f_scaled
    ) {
      currentTouchstoneData.frequency.f_scaled.forEach((freq, freqIndex) => {
        const dataCells: JSX.Element[] = []
        dataCells.push(<td key={`freq-${freqIndex}`}>{freq.toFixed(4)}</td>)

        if (currentTouchstoneData.nports !== undefined) {
          for (
            let outPort = 0;
            outPort < currentTouchstoneData.nports!;
            outPort++
          ) {
            for (
              let inPort = 0;
              inPort < currentTouchstoneData.nports!;
              inPort++
            ) {
              const param =
                currentTouchstoneData.matrix?.[outPort]?.[inPort]?.[freqIndex]
              // Use the internal formatting function and the format prop
              const formatted = formatSParameterForDisplay(param, format)
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

  // Main render output of the DataTable component
  return (
    <div>
      <h3>Network Data</h3>
      <table>
        <thead>{renderTableHeaders(touchstone)}</thead>
        <tbody>{renderTableRows(touchstone)}</tbody>
      </table>
    </div>
  )
}

export default DataTable
