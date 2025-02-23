import { run } from './python'
import { abs, complex, random, round } from 'mathjs'
import { Touchstone, TouchstoneMatrix } from '@/touchstone'

/**
 * Generate touchstone file string from a Touchstone instance using python scikit-rf library
 * @param touchstone
 * @returns
 */
export const pythonGenerateTouchstoneString = async (
  touchstone: Touchstone
) => {
  if (!touchstone) {
    throw new Error('Touchstone instance is not defined')
  }
  if (!touchstone.frequency) {
    throw new Error('Touchstone frequency is not defined')
  }
  if (!touchstone.matrix) {
    throw new Error('Touchstone matrix is not defined')
  }
  if (!touchstone.parameter) {
    throw new Error('Touchstone parameter is not defined')
  }
  if (!touchstone.format) {
    throw new Error('Touchstone format is not defined')
  }

  // Calculate the impedance python code to initialize the network impedance
  let impedanceString = ''
  if (typeof touchstone.impedance === 'number') {
    impedanceString = `, z0=${touchstone.impedance}`
  } else if (Array.isArray(touchstone.impedance)) {
    impedanceString = `, z0=[${touchstone.impedance}]`
  }

  const code = `
    import io, pathlib, skrf, uuid
    import numpy as np

    # Create network
    frequency = skrf.Frequency.from_f([${touchstone.frequency.value}], unit='${touchstone.frequency.unit}')
    data = np.array(${convertMatrixPythonString(touchstone.matrix)})
    ntwk = skrf.Network(frequency=frequency, ${touchstone.parameter.toLowerCase()}=data${impedanceString})

    # Create a temp folder
    folder = pathlib.Path.cwd() / 'tests' / 'python' / 'temp'
    folder.mkdir(parents=True, exist_ok=True)
    file = folder / f"{str(uuid.uuid4())}.s${touchstone.nports}p"
    # Create a touchstone file
    ntwk.write_touchstone(file, form='${touchstone.format}')

    # Read touchstone file
    with open(file, "r") as f:
      content = f.read()
    # Delete the touchstone file
    file.unlink()

    print(content)
  `
  return await run(code)
}

/**
 * Create touchstone matrix with random values
 */
export const createRandomTouchstoneMatrix = (touchstone: Touchstone) => {
  if (!touchstone) {
    throw new Error('Touchstone instance is not defined')
  }
  if (!touchstone.nports) {
    throw new Error('Touchstone nports is not defined')
  }
  if (!touchstone.frequency) {
    throw new Error('Touchstone frequency is not defined')
  }
  const matrix = new Array(touchstone.nports)
  for (let outPort = 0; outPort < touchstone.nports; outPort++) {
    matrix[outPort] = new Array(touchstone.nports)
    for (let inPort = 0; inPort < touchstone.nports; inPort++) {
      matrix[outPort][inPort] = new Array(touchstone.frequency.value.length)
      for (let p = 0; p < touchstone.frequency.value.length; p++) {
        matrix[outPort][inPort][p] = complex(
          round(random(-1, 1), 3),
          round(random(-1, 1), 3)
        )
      }
    }
  }
  return matrix
}

export const convertMatrixPythonString = (matrix: TouchstoneMatrix) => {
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

  // Convert to skrf format: a 3-dimensional numpy.ndarray which has shape f x n x n,
  // where f is frequency axis and n is number of ports. Note that indexing starts at 0,
  // so s11 can be accessed by taking the slice s[:,0,0], and s21 can be accessed by take
  // the slice s[:,1,0]
  const data = new Array(points)
  for (let p = 0; p < points; p++) {
    data[p] = new Array(nports)
    for (let outPort = 0; outPort < nports; outPort++) {
      data[p][outPort] = new Array(nports)
      for (let inPort = 0; inPort < nports; inPort++) {
        const value = matrix[outPort][inPort][p]
        const real = value.re
        const imag = abs(value.im)
        const sign = value.im >= 0 ? '+' : '-'
        const string = `${real}${sign}${imag}j`
        data[p][outPort][inPort] = string
      }
    }
  }

  return JSON.stringify(data, null, 2)
}
