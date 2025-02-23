import { describe, it, expect } from 'vitest'
import { Touchstone } from '@/touchstone'
import { Frequency } from '@/frequency'
import { createRandomTouchstoneMatrix } from './randomTouchstoneMatrix'

describe('randomTouchstoneMatrix.ts', () => {
  it('should throw error for undefined touchstone', () => {
    expect(() => createRandomTouchstoneMatrix(undefined as never)).toThrow(
      'Touchstone instance is not defined'
    )
  })

  it('should throw error for undefined nports', () => {
    const touchstone = new Touchstone()
    expect(() => createRandomTouchstoneMatrix(touchstone)).toThrow(
      'Touchstone nports is not defined'
    )
  })

  it('should throw error for undefined frequency', () => {
    const touchstone = new Touchstone()
    touchstone.nports = 2
    expect(() => createRandomTouchstoneMatrix(touchstone)).toThrow(
      'Touchstone frequency is not defined'
    )
  })

  it('should create valid random matrix for 1-port network', () => {
    const touchstone = new Touchstone()
    touchstone.nports = 1
    touchstone.frequency = new Frequency()
    touchstone.frequency.f_scaled = [1, 2, 3]

    const matrix = createRandomTouchstoneMatrix(touchstone)

    // Check matrix dimensions
    expect(matrix.length).toBe(1)
    expect(matrix[0].length).toBe(1)
    expect(matrix[0][0].length).toBe(3)

    // Check each value is a valid complex number within range
    matrix[0][0].forEach((value) => {
      expect(value.constructor.name).toBe('Complex')
      expect(value.re).toBeGreaterThanOrEqual(-1)
      expect(value.re).toBeLessThanOrEqual(1)
      expect(value.im).toBeGreaterThanOrEqual(-1)
      expect(value.im).toBeLessThanOrEqual(1)
    })

    // Check touchstone validate()
    expect(() => touchstone.validate()).toThrow(
      'Network parameter type is not defined'
    )
    touchstone.parameter = 'S'
    expect(() => touchstone.validate()).toThrow(
      'Data format (RI/MA/DB) is not defined'
    )
    touchstone.format = 'RI'
    expect(() => touchstone.validate()).toThrow(
      'Network parameter matrix is not defined'
    )
    touchstone.matrix = matrix
    touchstone.validate()
  })

  it('should create valid random matrix for 2-port network', () => {
    const touchstone = new Touchstone()
    touchstone.nports = 2
    touchstone.frequency = new Frequency()
    touchstone.frequency.f_scaled = [1, 2]

    const matrix = createRandomTouchstoneMatrix(touchstone)

    // Check matrix dimensions
    expect(matrix.length).toBe(2)
    matrix.forEach((row) => {
      expect(row.length).toBe(2)
      row.forEach((col) => {
        expect(col.length).toBe(2)
        col.forEach((value) => {
          expect(value.constructor.name).toBe('Complex')
          expect(value.re).toBeGreaterThanOrEqual(-1)
          expect(value.re).toBeLessThanOrEqual(1)
          expect(value.im).toBeGreaterThanOrEqual(-1)
          expect(value.im).toBeLessThanOrEqual(1)
        })
      })
    })

    // Check touchstone validate()
    expect(() => touchstone.validate()).toThrow(
      'Network parameter type is not defined'
    )
    touchstone.parameter = 'S'
    expect(() => touchstone.validate()).toThrow(
      'Data format (RI/MA/DB) is not defined'
    )
    touchstone.format = 'RI'
    expect(() => touchstone.validate()).toThrow(
      'Network parameter matrix is not defined'
    )
    touchstone.matrix = matrix
    touchstone.validate()
  })
})
