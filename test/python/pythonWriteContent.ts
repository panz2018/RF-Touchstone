import { run } from './python'
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
  const matrixLiteral = convertMatrixPythonString(touchstone.matrix!)

  // Python script to generate Touchstone file
  const code = `
    import io, pathlib, skrf, uuid, os
    import numpy as np

    # Create network frequency points
    frequency = skrf.Frequency.from_f(
      [${touchstone.frequency!.f_scaled}], 
      unit='${touchstone.frequency!.unit}'
    )

    # Convert network parameters to complex numpy array
    # Using explicit complex literals to ensure scikit-rf receives numeric data
    data = np.array(${matrixLiteral}, dtype=np.complex128)

    # Initialize network with parameters
    ntwk = skrf.Network(
      frequency=frequency, 
      ${touchstone.parameter!.toLowerCase()}=data${impedanceString}
    )

    # Setup temporary file path in a robust way
    temp_dir = pathlib.Path.cwd() / 'test' / 'python' / 'temp'
    os.makedirs(temp_dir, exist_ok=True)
    file_path = temp_dir / f"{str(uuid.uuid4())}.s${touchstone.nports}p"

    try:
        # Write and read Touchstone file
        ntwk.write_touchstone(str(file_path), form='${touchstone.format}')
        with open(file_path, "r", encoding='utf-8') as f:
            content = f.read()
    finally:
        # Ensure cleanup even if write/read fails
        if file_path.exists():
            file_path.unlink()

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

  // Build a Python-compatible complex literal array string
  // Format: [ [ [complex(re, im), ...], [...] ], ... ]
  let result = '['
  for (let p = 0; p < points; p++) {
    result += '['
    for (let outPort = 0; outPort < nports; outPort++) {
      result += '['
      for (let inPort = 0; inPort < nports; inPort++) {
        const val = matrix[outPort][inPort][p]
        // Use complex() operator for maximum compatibility and clarity in Python
        result += `complex(${val.re},${val.im})`
        if (inPort < nports - 1) result += ','
      }
      result += ']'
      if (outPort < nports - 1) result += ','
    }
    result += ']'
    if (p < points - 1) result += ','
  }
  result += ']'

  return result
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
