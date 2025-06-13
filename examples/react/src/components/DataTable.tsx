import React, { JSX } from 'react'
import { Touchstone, Complex, abs, arg } from 'rf-touchstone' // Removed 'complex' import

/**
 * Props for the DataTable component.
 */
interface DataTableProps {
  /** The loaded Touchstone data object, or null if no data is available or an error occurred. */
  touchstone: Touchstone | null
  /** The currently selected frequency unit (e.g., "GHz", "MHz") to be displayed in the frequency column header. */
  unit: string | undefined
  /** The currently selected S-parameter display format (e.g., 'RI', 'MA', 'DB') which dictates how data is shown. */
  format: string | undefined
}

/**
 * Determines the unit names for the two parts of an S-parameter based on the display format.
 * @param currentFormat The current S-parameter display format ('RI', 'MA', 'DB').
 * @returns An object with `unit1` and `unit2` string properties.
 */
const getSParameterUnitNames = (currentFormat: string | undefined): { unit1: string; unit2: string } => {
  if (currentFormat === undefined) {
    return { unit1: '', unit2: '' };
  }
  switch (currentFormat) {
    case 'RI':
      return { unit1: 'Real', unit2: 'Imaginary' };
    case 'MA':
      return { unit1: 'Magnitude', unit2: 'Angle (°)' };
    case 'DB':
      return { unit1: 'dB', unit2: 'Angle (°)' };
    default:
      return { unit1: '', unit2: '' };
  }
};

/**
 * Formats the numerical values of a complex S-parameter based on the display format.
 * @param param The complex S-parameter value (or undefined).
 * @param currentFormat The current S-parameter display format ('RI', 'MA', 'DB').
 * @returns An object with `value1` and `value2` string properties (formatted numbers).
 */
const formatSParameterValues = (param: Complex | undefined, currentFormat: string | undefined): { value1: string; value2: string } => {
  if (!param || currentFormat === undefined) {
    return { value1: 'N/A', value2: 'N/A' };
  }
  switch (currentFormat) {
    case 'RI':
      return {
        value1: (param.re as unknown as number).toFixed(4),
        value2: (param.im as unknown as number).toFixed(4),
      };
    case 'MA':
      const magnitude = abs(param) as unknown as number;
      const angle = (arg(param) * 180) / Math.PI;
      return {
        value1: magnitude.toFixed(4),
        value2: angle.toFixed(4),
      };
    case 'DB':
      const dbValue = 20 * Math.log10(abs(param) as unknown as number);
      const dbAngle = (arg(param) * 180) / Math.PI;
      return {
        value1: dbValue.toFixed(4),
        value2: dbAngle.toFixed(4),
      };
    default:
      return { value1: 'N/A', value2: 'N/A' };
  }
};

/**
 * DataTable component.
 * Renders the main table displaying Touchstone network parameter data (e.g., S-parameters).
 * It handles the generation of table headers and rows based on the provided Touchstone object
 * and the selected display format and frequency unit.
 */
const DataTable: React.FC<DataTableProps> = ({
  touchstone,
  unit,
  format,
}) => {
  // If no Touchstone data, or critical parts of it (matrix, scaled frequencies) are missing,
  // display a message indicating data unavailability.
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
   * Generates the table header row (<thead>).
   * The first column is always "Frequency" with its current unit.
   * Subsequent columns are for S-parameters (e.g., S11, S12), with sub-headers
   * indicating the two parts of the complex value (e.g., Real/Imaginary) based on the selected format.
   * @param currentTouchstoneData The active Touchstone object.
   * @returns A JSX.Element representing the table header row (<tr>).
   */
  const renderTableHeaders = (currentTouchstoneData: Touchstone): JSX.Element => {
    const headers: JSX.Element[] = []
    // The first header column displays the frequency and its current unit.
    headers.push(
      <th key="frequency">
        Frequency ({unit || currentTouchstoneData.frequency?.unit || 'N/A'})
      </th>
    )

    // Dynamically generate headers for each S-parameter based on the number of ports.
    if (currentTouchstoneData.nports !== undefined) {
      const units = getSParameterUnitNames(format); // Get unit names based on the format prop
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
          // Determine S-parameter name (e.g., S11, S21) based on port count and indexing.
          if (currentTouchstoneData.nports === 2) {
            paramName = `${currentTouchstoneData.parameter || 'S'}${inPort + 1}${outPort + 1}`
          } else {
            paramName = `${currentTouchstoneData.parameter || 'S'}${outPort + 1}${inPort + 1}`
          }

          // Each S-parameter corresponds to two table columns (e.g., one for Real, one for Imaginary).
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
   * Generates the table body rows (<tbody>).
   * Each row corresponds to a frequency point from the Touchstone data.
   * S-parameter values are formatted using the internal `formatSParameterValues` function
   * based on the current `format` prop.
   * @param currentTouchstoneData The active Touchstone object.
   * @returns A React.Fragment containing all table data rows (<tr> elements).
   */
  const renderTableRows = (currentTouchstoneData: Touchstone): JSX.Element => {
    const rows: JSX.Element[] = []

    // Ensure matrix and scaled frequency data are available.
    if (
      currentTouchstoneData.matrix &&
      currentTouchstoneData.frequency?.f_scaled
    ) {
      // Iterate over each frequency point to create a table row.
      currentTouchstoneData.frequency.f_scaled.forEach((freq, freqIndex) => {
        const dataCells: JSX.Element[] = []
        // The first cell in each row displays the frequency value, formatted to 4 decimal places.
        dataCells.push(<td key={`freq-${freqIndex}`}>{freq.toFixed(4)}</td>)

        // Iterate over S-parameters for the current frequency point.
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
              // Retrieve the complex S-parameter value from the matrix.
              const param =
                currentTouchstoneData.matrix?.[outPort]?.[inPort]?.[freqIndex]
              // Format the S-parameter using the selected display format.
              const values = formatSParameterValues(param, format)

              // Add two cells for the formatted S-parameter (e.g., Real and Imaginary parts).
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
    return <>{rows}</> // Return rows wrapped in a React Fragment.
  }

  // Main render output of the DataTable component.
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
