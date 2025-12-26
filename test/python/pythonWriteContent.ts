import { run } from './python'
import { abs } from 'mathjs'
import { Touchstone, TouchstoneMatrix } from '@/touchstone'

/**
 * Generate Touchstone file content using Python scikit-rf library
 *
 * @param touchstone - Touchstone instance containing network parameters
 * @returns Promise<string> - Generated Touchstone file content
 * @throws {Error} If Touchstone instance is invalid or matrix conversion fails
 */
export const pythonWriteContent = async (
  touchstone: Touchstone
): Promise<string> => {
  // Validate input
  if (!touchstone) {
    throw new Error('Touchstone instance is not defined')
  }
  touchstone.validate()

  // Generate impedance initialization code for Python
  const impedanceString = generateImpedanceString(touchstone.impedance)

  // Python script to generate Touchstone file
  const code = `
    import io, pathlib, skrf, uuid
    import numpy as np

    # Create network frequency points
    frequency = skrf.Frequency.from_f(
      [${touchstone.frequency!.f_scaled}], 
      unit='${touchstone.frequency!.unit}'
    )

    # Convert network parameters to numpy array
    data = np.array(${convertMatrixPythonString(touchstone.matrix!)})

    # Initialize network with parameters
    ntwk = skrf.Network(
      frequency=frequency, 
      ${touchstone.parameter!.toLowerCase()}=data${impedanceString}
    )

    # Setup temporary file path
    folder = pathlib.Path.cwd() / 'test' / 'python' / 'temp'
    folder.mkdir(parents=True, exist_ok=True)
    file = folder / f"{str(uuid.uuid4())}.s${touchstone.nports}p"

    # Write and read Touchstone file
    ntwk.write_touchstone(file, form='${touchstone.format}')
    with open(file, "r") as f:
      content = f.read()
    
    # Cleanup temporary file
    file.unlink()

    print(content)
  `
  return await run(code)
}

/**
 * Generate Python impedance initialization string
 * @param impedance - Single impedance value or array of port impedances
 * @returns Formatted impedance string for Python code
 */
export const generateImpedanceString = (
  impedance: number | number[]
): string => {
  if (typeof impedance === 'number') {
    return `, z0=${impedance}`
  }
  if (Array.isArray(impedance)) {
    return `, z0=[${impedance}]`
  }
  return ''
}

/**
 * Convert Touchstone matrix to Python-compatible string format
 *
 * @param matrix - 3D matrix of network parameters
 * @returns JSON string representation of the matrix
 * @throws {Error} If matrix is invalid or has inconsistent dimensions
 *
 * @remarks
 * Converts to scikit-rf format: 3D numpy.ndarray with shape (f,n,n)
 * where:
 * - f: number of frequency points
 * - n: number of ports
 * Matrix indexing starts at 0, e.g.:
 * - s11 = s[:,0,0]
 * - s21 = s[:,1,0]
 */
const convertMatrixPythonString = (matrix: TouchstoneMatrix): string => {
  // Validate matrix
  validateMatrix(matrix)

  const nports = matrix.length
  const points = matrix[0][0].length

  // Convert to Python format (frequency points × output ports × input ports)
  const data = new Array(points)
  for (let p = 0; p < points; p++) {
    data[p] = new Array(nports)
    for (let outPort = 0; outPort < nports; outPort++) {
      data[p][outPort] = new Array(nports)
      for (let inPort = 0; inPort < nports; inPort++) {
        const value = matrix[outPort][inPort][p]
        data[p][outPort][inPort] = formatComplexNumber(value)
      }
    }
  }

  return JSON.stringify(data, null, 2)
}

/**
 * Validate Touchstone matrix dimensions and structure
 * @param matrix - Matrix to validate
 * @throws {Error} If matrix is invalid
 */
export const validateMatrix = (matrix: TouchstoneMatrix): void => {
  if (!matrix) {
    throw new Error('Touchstone matrix is not defined')
  }

  const nports = matrix.length
  let points: number | undefined

  for (let outPort = 0; outPort < nports; outPort++) {
    if (matrix[outPort].length !== nports) {
      throw new Error(
        'Input and output dimensions of Touchstone matrix is not the same'
      )
    }
    for (let inPort = 0; inPort < nports; inPort++) {
      if (points === undefined) {
        points = matrix[outPort][inPort].length
      } else if (points !== matrix[outPort][inPort].length) {
        throw new Error('Touchstone matrix has missing values')
      }
    }
  }

  if (points === undefined) {
    throw new Error('Touchstone matrix is empty')
  }
}

/**
 * Format complex number for Python
 * @param value - Complex number to format
 * @returns Python complex number string representation
 */
const formatComplexNumber = (value: { re: number; im: number }): string => {
  const real = value.re
  const imag = abs(value.im)
  const sign = value.im >= 0 ? '+' : '-'
  return `${real}${sign}${imag}j`
}
