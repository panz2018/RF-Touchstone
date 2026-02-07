import { Frequency } from '@/frequency'
import { Touchstone } from '@/touchstone'
import { random, round } from 'mathjs'
import { describe, expect, it } from 'vitest'
import { pythonReadContent } from './pythonReadContent'
import { createRandomTouchstoneMatrix } from './randomTouchstoneMatrix'

/**
 * Test suite for pythonReadContent functionality
 * Validates the compatibility between TypeScript Touchstone implementation
 * and Python scikit-rf library by comparing parsing results
 */
describe('pythonReadContent', () => {
  /**
   * Test case 1: 2-port network with Real-Imaginary format S-parameters
   *
   * Workflow:
   * 1. Create a 2-port Touchstone instance with RI format
   * 2. Generate random S-parameters
   * 3. Convert to Touchstone string format
   * 4. Parse using Python scikit-rf
   * 5. Compare parsed results with original data
   */
  it('Compare with Python scikit-rf: 2 ports, RI format, s-parameter', async () => {
    // Initialize a new Touchstone instance with test configuration
    const touchstone = new Touchstone()
    touchstone.format = 'RI' // Real-Imaginary format
    touchstone.parameter = 'S' // S-parameters
    touchstone.impedance = round(random(1, 50), 3) // Random impedance between 1-50Ω
    touchstone.nports = 2 // 2-port network
    touchstone.frequency = new Frequency()
    touchstone.frequency.unit = 'GHz' // Frequency unit in GHz
    touchstone.frequency.f_scaled = [1, 3, 5] // Test frequencies: 1, 3, 5 GHz
    touchstone.matrix = createRandomTouchstoneMatrix(touchstone)

    // Generate Touchstone format string and parse with Python
    const content = touchstone.writeContent()
    const result = await pythonReadContent(
      content,
      touchstone.nports,
      touchstone.parameter
    )
    const data = JSON.parse(result)

    // Validate basic network properties
    expect(data.frequency.unit).toBe(touchstone.frequency.unit)
    expect(data.frequency.f_scaled).toStrictEqual(touchstone.frequency.f_scaled)
    expect(data.impedance).toBe(touchstone.impedance)

    // Validate matrix structure and values
    validateMatrix(data.matrix, touchstone)
  })

  /**
   * Test case 2: 3-port network with Decibel-Angle format S-parameters
   *
   * Workflow:
   * 1. Create a 3-port Touchstone instance with DB format
   * 2. Generate random S-parameters
   * 3. Convert to Touchstone string format
   * 4. Parse using Python scikit-rf
   * 5. Compare parsed results with original data
   */
  it('Compare with Python scikit-rf: 3 ports, DB format, s-parameter', async () => {
    // Initialize a new Touchstone instance with test configuration
    const touchstone = new Touchstone()
    touchstone.format = 'DB' // Decibel-Angle format
    touchstone.parameter = 'S' // S-parameters
    touchstone.impedance = round(random(1, 50), 3) // Random impedance between 1-50Ω
    touchstone.nports = 3 // 3-port network
    touchstone.frequency = new Frequency()
    touchstone.frequency.unit = 'GHz' // Frequency unit in GHz
    touchstone.frequency.f_scaled = [1, 3, 5] // Test frequencies: 1, 3, 5 GHz
    touchstone.matrix = createRandomTouchstoneMatrix(touchstone)

    // Generate Touchstone format string and parse with Python
    const content = touchstone.writeContent()
    const result = await pythonReadContent(
      content,
      touchstone.nports,
      touchstone.parameter
    )
    const data = JSON.parse(result)

    // Validate basic network properties
    expect(data.frequency.unit).toBe(touchstone.frequency.unit)
    expect(data.frequency.f_scaled).toStrictEqual(touchstone.frequency.f_scaled)
    expect(data.impedance).toBe(touchstone.impedance)

    // Validate matrix structure and values
    validateMatrix(data.matrix, touchstone)
  })

  /**
   * Helper function to validate the network parameter matrix
   * Compares dimensions and complex values between TypeScript and Python results
   *
   * @param matrix - Matrix data from Python parsing
   * @param touchstone - Original Touchstone instance
   */
  function validateMatrix(
    matrix: { re: number; im: number }[][][],
    touchstone: Touchstone
  ) {
    expect(matrix.length).toBe(touchstone.nports)
    for (let m = 0; m < touchstone.nports!; m++) {
      // Verify port dimensions
      expect(matrix[m].length).toBe(touchstone.nports)
      for (let n = 0; n < touchstone.nports!; n++) {
        // Verify frequency points dimension
        const points = touchstone.frequency!.f_scaled.length
        expect(matrix[m][n].length).toBe(points)
        for (let p = 0; p < points; p++) {
          // Compare complex values with 5 decimal places tolerance
          const expected = touchstone.matrix![m][n][p]
          const actual = matrix[m][n][p]
          expect(actual.re).toBeCloseTo(expected.re, 5)
          expect(actual.im).toBeCloseTo(expected.im, 5)
        }
      }
    }
  }
})
