import { Touchstone, TouchstoneMatrix } from '@/touchstone'
import { complex, Complex, random, round } from 'mathjs'

/**
 * Creates a random Touchstone matrix for testing purposes.
 *
 * @param touchstone - The Touchstone instance containing network configuration
 * @returns A 3D matrix of complex numbers representing network parameters
 *
 * @remarks
 * The matrix is generated with the following structure:
 * - First dimension: output port index (0 to nports-1)
 * - Second dimension: input port index (0 to nports-1)
 * - Third dimension: frequency point index
 *
 * Each matrix element is a complex number where:
 * - Real part: random value between -1 and 1 (rounded to 3 decimal places)
 * - Imaginary part: random value between -1 and 1 (rounded to 3 decimal places)
 *
 * @throws {Error} If touchstone instance is not defined
 * @throws {Error} If number of ports is not defined
 * @throws {Error} If frequency object is not defined
 */
export const createRandomTouchstoneMatrix = (
  touchstone: Touchstone
): TouchstoneMatrix => {
  if (!touchstone) {
    throw new Error('Touchstone instance is not defined')
  }
  if (!touchstone.nports) {
    throw new Error('Touchstone nports is not defined')
  }
  if (!touchstone.frequency) {
    throw new Error('Touchstone frequency is not defined')
  }

  // Initialize the 3D matrix with dimensions: [nports][nports][frequency_points]
  const matrix = Array.from<Complex[][]>({ length: touchstone.nports })
  for (let outPort = 0; outPort < touchstone.nports; outPort++) {
    matrix[outPort] = Array.from<Complex[]>({ length: touchstone.nports })
    for (let inPort = 0; inPort < touchstone.nports; inPort++) {
      matrix[outPort][inPort] = Array.from<Complex>({
        length: touchstone.frequency.f_scaled.length,
      })
      for (let p = 0; p < touchstone.frequency.f_scaled.length; p++) {
        // Generate random complex number: real + j*imag
        matrix[outPort][inPort][p] = complex(
          round(random(-1, 1), 3), // Real part
          round(random(-1, 1), 3) // Imaginary part
        )
      }
    }
  }
  return matrix
}
