import { describe, it, expect } from 'vitest'
import { random, round } from 'mathjs'
import { Touchstone } from '@/touchstone'
import type { TouchstoneFormat, TouchstoneMatrix } from '@/touchstone'
import { Frequency } from '@/frequency'
import {
  pythonWriteContent,
  generateImpedanceString,
  validateMatrix,
} from './pythonWriteContent'
import { createRandomTouchstoneMatrix } from './randomTouchstoneMatrix'

/**
 * Test suite for pythonWriteContent functionality
 * Validates the compatibility between TypeScript Touchstone implementation
 * and Python scikit-rf library by comparing write/read results
 */
describe('pythonWriteContent.ts', () => {
  /**
   * Helper function to create a test Touchstone instance
   * @param format - Network parameter format (RI/MA/DB)
   * @param nports - Number of ports
   * @returns Configured Touchstone instance
   */
  const createTestNetwork = (
    format: TouchstoneFormat,
    nports: number
  ): Touchstone => {
    const touchstone = new Touchstone()
    touchstone.format = format
    touchstone.parameter = 'S'
    touchstone.impedance = round(random(1, 50), 3) // Random impedance in [1,50]Ω
    touchstone.nports = nports
    touchstone.frequency = new Frequency()
    touchstone.frequency.unit = 'GHz'
    touchstone.frequency.f_scaled = [1, 3, 5] // Test at 1, 3, and 5 GHz
    touchstone.matrix = createRandomTouchstoneMatrix(touchstone)
    return touchstone
  }

  /**
   * Helper function to validate network configuration
   */
  const validateNetworkConfig = (source: Touchstone, target: Touchstone) => {
    expect(target.format).toBe(source.format)
    expect(target.parameter).toBe(source.parameter)
    expect(target.impedance).toBe(source.impedance)
    expect(target.nports).toBe(source.nports)
    expect(target.frequency!.unit).toBe(source.frequency!.unit)
    expect(target.frequency!.f_scaled).toStrictEqual(source.frequency!.f_scaled)
  }

  /**
   * Helper function to validate network matrix
   */
  const validateNetworkMatrix = (source: Touchstone, target: Touchstone) => {
    expect(target.matrix!.length).toBe(source.nports)
    for (let m = 0; m < source.nports!; m++) {
      expect(target.matrix![m].length).toBe(source.nports)
      for (let n = 0; n < source.nports!; n++) {
        const points = source.frequency!.f_scaled.length
        expect(target.matrix![m][n].length).toBe(points)
        for (let p = 0; p < points; p++) {
          const expected = source.matrix![m][n][p]
          const actual = target.matrix![m][n][p]
          expect(actual.re).toBeCloseTo(expected.re, 5)
          expect(actual.im).toBeCloseTo(expected.im, 5)
        }
      }
    }
  }

  /**
   * Test case: 2-port network with Real-Imaginary format
   * Tests writing and reading back a 2-port S-parameter network
   */
  it('2-port network, RI format, S-parameters', async () => {
    // Create and write test network
    const source = createTestNetwork('RI', 2)
    const content = await pythonWriteContent(source)

    // Read back and validate
    const target = new Touchstone()
    target.readContent(content, source.nports!)
    validateNetworkConfig(source, target)
    validateNetworkMatrix(source, target)
  })

  /**
   * Test case: 3-port network with Decibel-Angle format
   * Tests writing and reading back a 3-port S-parameter network
   */
  it('3-port network, DB format, S-parameters', async () => {
    // Create and write test network
    const source = createTestNetwork('DB', 3)
    const content = await pythonWriteContent(source)

    // Read back and validate
    const target = new Touchstone()
    target.readContent(content, source.nports!)
    validateNetworkConfig(source, target)
    validateNetworkMatrix(source, target)
  })

  it('Touchstone: Null', async () => {
    // We cast to any to bypass TypeScript's static check for the test
    const action = () => pythonWriteContent(null as unknown as Touchstone)
    // Verify it rejects with the exact error message from image_0f9965.png
    await expect(action()).rejects.toThrow('Touchstone instance is not defined')
  })
})

describe('generateImpedanceString', () => {
  it('should return a single z0 string for a number', () => {
    expect(generateImpedanceString(50)).toBe(', z0=50')
  })

  it('should return a z0 array string for an array of numbers', () => {
    const input = [50, 75]
    expect(generateImpedanceString(input)).toBe(`, z0=[${input}]`)
  })

  it('should return an empty string for unexpected types', () => {
    expect(generateImpedanceString(null as unknown as number)).toBe('')
    expect(generateImpedanceString('invalid' as unknown as number)).toBe('')
  })
})

describe('validateMatrix', () => {
  it('should throw if matrix is not defined', () => {
    expect(() => validateMatrix(null as unknown as TouchstoneMatrix)).toThrow(
      'Touchstone matrix is not defined'
    )
  })

  it('should throw if dimensions are not square', () => {
    const matrix = [[1], [1, 2]] // Row 0 length 1 != total rows 2
    expect(() => validateMatrix(matrix as unknown as TouchstoneMatrix)).toThrow(
      'Input and output dimensions of Touchstone matrix is not the same'
    )
  })

  it('should throw if matrix has missing values', () => {
    const matrix = [
      [
        [1, 2],
        [1, 2],
      ],
      [[1, 2], [1]], // Missing a point in the second port
    ]
    expect(() => validateMatrix(matrix as unknown as TouchstoneMatrix)).toThrow(
      'Touchstone matrix has missing values'
    )
  })

  it('should throw if matrix is empty', () => {
    expect(() => validateMatrix([])).toThrow('Touchstone matrix is empty')
  })
})
