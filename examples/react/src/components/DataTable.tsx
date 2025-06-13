import React, { JSX } from 'react'
import { Touchstone, Complex, complex } from 'rf-touchstone'

/**
 * Props for the DataTable component.
 */
interface DataTableProps {
  /** The loaded Touchstone data object, or null if no data/error. */
  touchstone: Touchstone | null
  /**
   * Function passed from the parent to format a complex S-parameter
   * into a string representation based on the selected format (RI, MA, DB).
   * Returns an object with two value parts and their corresponding units.
   */
  formatParameter: (
    param: Complex | undefined,
    format: string | undefined
  ) => { value1: string; value2: string; unit1: string; unit2: string }
}

/**
 * DataTable component.
 * Renders the main table displaying Touchstone network parameter data (e.g., S-parameters).
 * It handles the generation of table headers and rows based on the provided Touchstone object.
 */
const DataTable: React.FC<DataTableProps> = ({
  touchstone,
  formatParameter,
}) => {
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
   * @param currentTouchstoneData The Touchstone object containing the data.
   * @returns A JSX.Element representing the table header row (<tr>).
   */
  const renderTableHeaders = (currentTouchstoneData: Touchstone): JSX.Element => {
    const headers: JSX.Element[] = []
    // First column is always Frequency
    headers.push(
      <th key="frequency">
        Frequency ({currentTouchstoneData.frequency?.unit})
      </th>
    )

    // Generate headers for each S-parameter (e.g., S11, S12, S21, S22 for 2-port)
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
          // Determine S-parameter name based on port count and indexing convention
          if (currentTouchstoneData.nports === 2) {
            paramName = `${currentTouchstoneData.parameter || 'S'}${inPort + 1}${outPort + 1}`
          } else {
            // For n-port, typical notation is S[row][col] -> S[outPort+1][inPort+1]
            paramName = `${currentTouchstoneData.parameter || 'S'}${outPort + 1}${inPort + 1}`
          }

          // Use a placeholder complex number to get unit names from formatParameter
          const placeholderParam = complex(0, 0)
          const formattedHeader = formatParameter(
            placeholderParam,
            currentTouchstoneData.format
          )

          // Each S-parameter has two parts (e.g., Real/Imag, Mag/Angle, dB/Angle)
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
   * and formatting the S-parameter data according to the selected format.
   * @param currentTouchstoneData The Touchstone object containing the data.
   * @returns A React.Fragment containing all table rows (<tr>).
   */
  const renderTableRows = (currentTouchstoneData: Touchstone): JSX.Element => {
    const rows: JSX.Element[] = []

    if (
      currentTouchstoneData.matrix &&
      currentTouchstoneData.frequency?.f_scaled
    ) {
      // Iterate over each frequency point
      currentTouchstoneData.frequency.f_scaled.forEach((freq, freqIndex) => {
        const dataCells: JSX.Element[] = []
        // First cell in a row is the frequency value
        dataCells.push(<td key={`freq-${freqIndex}`}>{freq.toFixed(4)}</td>)

        // Iterate over S-parameters for the current frequency
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
              // Get the complex S-parameter value
              const param =
                currentTouchstoneData.matrix?.[outPort]?.[inPort]?.[freqIndex]
              // Format it using the provided function
              const formatted = formatParameter(
                param,
                currentTouchstoneData.format
              )
              // Add two cells for the two parts of the formatted S-parameter
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
    return <>{rows}</> // Use React.Fragment to return multiple <tr> elements
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
