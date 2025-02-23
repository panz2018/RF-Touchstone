import { describe, it, expect } from 'vitest'
import { Frequency, FrequencyUnits } from '@/frequency'

describe('frequency.ts', () => {
  it('Valid class', () => {
    expect(Frequency).toBeTruthy()
  })
  it('Frequency:unit', () => {
    const frequency = new Frequency()
    expect(frequency.unit).toBeTruthy()
    // Wrong input type
    expect(() => (frequency.unit = 0 as never)).toThrow(
      `Unknown frequency unit: 0`
    )
    expect(() => (frequency.unit = undefined as never)).toThrow(
      `Unknown frequency unit: undefined`
    )
    expect(() => (frequency.unit = null as never)).toThrow(
      `Unknown frequency unit: null`
    )
    // Wrong input value
    expect(() => (frequency.unit = 'z' as never)).toThrow(
      `Unknown frequency unit: z`
    )
    expect(() => (frequency.unit = '' as never)).toThrow(
      `Unknown frequency unit: `
    )
    // Correct input values
    for (const unit of FrequencyUnits) {
      frequency.unit = unit.toLowerCase() as never
      expect(frequency.unit).toBe(unit)
    }
  })
  it('Frequency:value', () => {
    const frequency = new Frequency()
    expect(frequency.value).toBeTruthy()
    // Wrong input type
    expect(() => (frequency.value = 0 as never)).toThrow(
      'Frequency value must be an array'
    )
    expect(() => (frequency.value = ['1', '2', '3'] as never[])).toThrow(
      'Frequency value must be an array of numbers'
    )
    expect(() => (frequency.value = [1, 2, -3])).toThrow(
      'Frequency values cannot be negative'
    )
    frequency.value = [1, 2, 3]
    expect(frequency.value).toStrictEqual([1, 2, 3])
  })
})
