import React, { JSX } from 'react'
import { Touchstone, Complex, abs, arg } from 'rf-touchstone'

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
 * Determines the unit names for the two parts of a formatted data value based on the display format.
 * @param currentFormat The current display format string (e.g., 'RI', 'MA', 'DB').
 * @returns An object with `unit1` and `unit2` string properties.
 */
const getUnitNames = (currentFormat: string | undefined): { unit1: string; unit2: string } => {
  if (currentFormat === undefined) {
    return { unit1: 'N/A', unit2: 'N/A' };
  }
  switch (currentFormat) {
    case 'RI':
      return { unit1: 'Real', unit2: 'Imaginary' };
    case 'MA':
      return { unit1: 'Magnitude', unit2: 'Angle (°)' };
    case 'DB':
      return { unit1: 'dB', unit2: 'Angle (°)' };
    default:
      return { unit1: 'N/A', unit2: 'N/A' };
  }
};

/**
 * Formats the numerical values of a complex data parameter based on the display format.
 * @param param The complex data parameter value (or undefined).
 * @param currentFormat The current display format string (e.g., 'RI', 'MA', 'DB').
 * @returns An object with `value1` and `value2` string properties (formatted numbers).
 */
const formatDataValues = (param: Complex | undefined, currentFormat: string | undefined): { value1: string; value2: string } => {
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
 * Module-level function to generate the table header row (<thead>).
 * The first column is always "Frequency" with its current unit.
 * Subsequent columns are for S-parameters (e.g., S11, S12), with sub-headers
 * indicating the two parts of the complex value (e.g., Real/Imaginary) based on the selected format.
 * @param touchstone The active Touchstone object.
 * @param unit The currently selected frequency unit for the header.
 * @param format The currently selected S-parameter display format.
 * @returns A JSX.Element representing the table header row (<tr>).
 */
const renderTableHeaders = (touchstone: Touchstone, unit: string | undefined, format: string | undefined): JSX.Element => {
  const headers: JSX.Element[] = []
  // The first header column displays the frequency and its current unit.
  headers.push(
    <th key="frequency">
      Frequency ({unit || touchstone.frequency?.unit || 'N/A'})
    </th>
  )

  // Dynamically generate headers for each S-parameter based on the number of ports.
  if (touchstone.nports !== undefined) {
    const units = getUnitNames(format); // Get unit names based on the format prop
    for (
      let outPort = 0;
      outPort < touchstone.nports!;
      outPort++
    ) {
      for (
        let inPort = 0;
        inPort < touchstone.nports!;
        inPort++
      ) {
        let paramName
        // Determine S-parameter name (e.g., S11, S21) based on port count and indexing.
        if (touchstone.nports === 2) {
          paramName = `${touchstone.parameter || 'S'}${inPort + 1}${outPort + 1}`
        } else {
          paramName = `${touchstone.parameter || 'S'}${outPort + 1}${inPort + 1}`
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
 * Module-level function to generate the table body rows (<tbody>).
 * Each row corresponds to a frequency point from the Touchstone data.
 * Parameter values are formatted using the internal `formatDataValues` function
 * based on the current `format` prop.
 * @param touchstone The active Touchstone object.
 * @param format The currently selected S-parameter display format.
 * @returns A React.Fragment containing all table data rows (<tr> elements).
 */
const renderTableRows = (touchstone: Touchstone, format: string | undefined): JSX.Element => {
  const rows: JSX.Element[] = []

  // Ensure matrix and scaled frequency data are available.
  if (
    touchstone.matrix &&
    touchstone.frequency?.f_scaled
  ) {
    // Iterate over each frequency point to create a table row.
    touchstone.frequency.f_scaled.forEach((freq, freqIndex) => {
      const dataCells: JSX.Element[] = []
      // The first cell in each row displays the frequency value, formatted to 4 decimal places.
      dataCells.push(<td key={`freq-${freqIndex}`}>{freq.toFixed(4)}</td>)

      // Iterate over S-parameters for the current frequency point.
      if (touchstone.nports !== undefined) {
        for (
          let outPort = 0;
          outPort < touchstone.nports!;
          outPort++
        ) {
          for (
            let inPort = 0;
            inPort < touchstone.nports!;
            inPort++
          ) {
            // Retrieve the complex S-parameter value from the matrix.
            const param =
              touchstone.matrix?.[outPort]?.[inPort]?.[freqIndex]
            // Format the S-parameter using the selected display format.
            const values = formatDataValues(param, format)

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

/**
 * DataTable component.
 * Renders the main table displaying Touchstone network parameter data (e.g., S-parameters).
 * It delegates the generation of table headers and rows to module-level helper functions,
 * passing them the necessary Touchstone data and display format information.
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

  // Main render output of the DataTable component.
  return (
    <div>
      <h3>Network Data</h3>
      <table>
        <thead>{renderTableHeaders(touchstone, unit, format)}</thead>
        <tbody>{renderTableRows(touchstone, format)}</tbody>
      </table>
    </div>
  )
}

export default DataTable
