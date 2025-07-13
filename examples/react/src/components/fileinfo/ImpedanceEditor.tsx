import React, { useState, useEffect } from 'react'
import { TouchstoneImpedance } from 'rf-touchstone'

interface ImpedanceEditorProps {
  currentImpedance: TouchstoneImpedance | undefined
  onImpedanceChange: (newImpedance: TouchstoneImpedance) => void
}

const ImpedanceEditor: React.FC<ImpedanceEditorProps> = ({
  currentImpedance,
  onImpedanceChange,
}) => {
  const impedanceToString = (imp: TouchstoneImpedance | undefined): string => {
    if (imp === undefined) return ''
    return Array.isArray(imp) ? imp.join(', ') : String(imp)
  }

  const [editableImpedanceStr, setEditableImpedanceStr] = useState<string>(
    impedanceToString(currentImpedance)
  )

  useEffect(() => {
    setEditableImpedanceStr(impedanceToString(currentImpedance))
  }, [currentImpedance])

  const handleImpedanceStrChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setEditableImpedanceStr(event.target.value)
  }

  const handleImpedanceBlur = () => {
    const values = editableImpedanceStr
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s !== '')
    let newImpedance: TouchstoneImpedance | null = null

    if (values.length === 0) {
      alert('Impedance cannot be empty.')
      setEditableImpedanceStr(impedanceToString(currentImpedance)) // Revert
      return
    }

    const parsedNumbers = values.map((v) => parseFloat(v))

    if (parsedNumbers.some(isNaN)) {
      alert('Invalid impedance: All values must be numbers.')
      setEditableImpedanceStr(impedanceToString(currentImpedance)) // Revert
      return
    }

    if (parsedNumbers.length === 1) {
      newImpedance = parsedNumbers[0]
    } else {
      newImpedance = parsedNumbers
    }

    if (
      impedanceToString(newImpedance) !== impedanceToString(currentImpedance)
    ) {
      onImpedanceChange(newImpedance)
    }
  }

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleImpedanceBlur()
      ;(event.target as HTMLInputElement).blur()
    }
  }

  return (
    <input
      type="text"
      value={editableImpedanceStr}
      onChange={handleImpedanceStrChange}
      onBlur={handleImpedanceBlur}
      onKeyPress={handleKeyPress}
      style={{ marginLeft: '0px', padding: '2px', width: '150px' }}
      title="Enter number or comma-separated numbers for multi-port"
      aria-label="Editable Impedance"
    />
  )
}

export default ImpedanceEditor
