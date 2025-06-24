import React, { JSX } from 'react'
import { Touchstone, Complex, abs, arg } from 'rf-touchstone'

/**
 * Props for the DataTable component.
 */
interface DataTableProps {
  /** The loaded Touchstone data object, or null if no data is available or an error occurred. */
  touchstone: Touchstone | null
  // unit and format props are removed; they will be derived from the touchstone object.
}

/**
 * DataTable component.
 * Renders the main table displaying Touchstone network parameter data (e.g., S-parameters).
 * Unit and format for display are derived directly from the `touchstone` object.
 */
const DataTable: React.FC<DataTableProps> = ({
  touchstone,
}) => {
  // Derive unit and format from the touchstone object
  const unit = touchstone?.frequency?.unit;
  const format = touchstone?.format;

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
    <div style={{ marginTop: '20px' }}> {/* Added margin for separation */}
      <h3>Network Data</h3>
      {/* Added a wrapper div for sticky positioning context and scrolling */}
      <div className="dataTableContainer" style={{ maxHeight: '500px', overflow: 'auto', border: '1px solid #ccc' }}>
        <table>
          <thead>{renderTableHeaders(touchstone, unit, format)}</thead>
          <tbody>{renderTableRows(touchstone, format)}</tbody>
        </table>
      </div>
    </div>
  )
}

export default DataTable

// --- Helper Functions (Moved to bottom) ---

/**
 * Determines the unit names for the two parts of a formatted data value based on the display format.
 * @param format The current display format string (e.g., 'RI', 'MA', 'DB').
 * @returns An object with `unit1` and `unit2` string properties.
 */
const getUnitNames = (format: string | undefined): { unit1: string; unit2: string } => {
  if (format === undefined) {
    return { unit1: 'N/A', unit2: 'N/A' };
  }
  switch (format) {
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
 * @param format The current display format string (e.g., 'RI', 'MA', 'DB').
 * @returns An object with `value1` and `value2` string properties (formatted numbers).
 */
const formatDataValues = (param: Complex | undefined, format: string | undefined): { value1: string; value2: string } => {
  if (!param || format === undefined) {
    return { value1: 'N/A', value2: 'N/A' };
  }
  switch (format) {
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
 * Subsequent columns are for S-parameters, consistently named S<OutputPort><InputPort>
 * (e.g., S11, S21), with sub-headers indicating the two parts of the complex value
 * (e.g., Real/Imaginary) based on the selected format.
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
    const units = getUnitNames(format);
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
        // Standard S-parameter naming: S<OutputPort><InputPort>
        // e.g., S21 means OutputPort=2, InputPort=1.
        // Loop iterates outPort first, then inPort.
        const paramName = `${touchstone.parameter || 'S'}${outPort + 1}${inPort + 1}`;

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
 * based on the current `format` prop.
 * The rf-touchstone library normalizes 2-port data upon parsing,
 * so matrix access is consistently matrix[outPort][inPort] for S<OutputPort><InputPort>.
 * @param touchstone The active Touchstone object.
 * @param format The currently selected S-parameter display format.
 * @returns A React.Fragment containing all table data rows (<tr> elements).
 */
const renderTableRows = (touchstone: Touchstone, format: string | undefined): JSX.Element => {
  const rows: JSX.Element[] = []

  if (
    touchstone.matrix &&
    touchstone.frequency?.f_scaled
  ) {
    touchstone.frequency.f_scaled.forEach((freq, freqIndex) => {
      const dataCells: JSX.Element[] = []
      dataCells.push(<td key={`freq-${freqIndex}`}>{freq.toFixed(4)}</td>)

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
            // Consistently access matrix using [outPort][inPort]
            // The rf-touchstone library handles normalization of 2-port files
            // to match this S<OutputPort><InputPort> iteration order.
            const param = touchstone.matrix?.[outPort]?.[inPort]?.[freqIndex];

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
