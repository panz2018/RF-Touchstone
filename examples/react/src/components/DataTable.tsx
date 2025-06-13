import React, { JSX } from 'react'
import { Touchstone, Complex, complex } from 'rf-touchstone'

interface DataTableProps {
  touchstone: Touchstone | null // Renamed here
  formatParameter: (
    param: Complex | undefined,
    format: string | undefined
  ) => { value1: string; value2: string; unit1: string; unit2: string }
}

const DataTable: React.FC<DataTableProps> = ({
  touchstone, // Renamed here
  formatParameter,
}) => {
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

  const renderTableHeaders = (currentTouchstoneData: Touchstone) => {
    const headers: JSX.Element[] = []
    headers.push(
      <th key="frequency">
        Frequency ({currentTouchstoneData.frequency?.unit})
      </th>
    )

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

          const placeholderParam = complex(0, 0) // Placeholder for unit determination
          const formattedHeader = formatParameter(
            placeholderParam,
            currentTouchstoneData.format
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

  const renderTableRows = (currentTouchstoneData: Touchstone) => {
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
              const formatted = formatParameter(
                param,
                currentTouchstoneData.format
              )
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
      <h3>Network Data</h3>
      <table>
        <thead>{renderTableHeaders(touchstone)}</thead>
        <tbody>{renderTableRows(touchstone)}</tbody>
      </table>
    </div>
  )
}

export default DataTable
