import { describe, it, expect } from 'vitest'
import { Frequency, FrequencyUnits } from '@/frequency'

describe('frequency.ts', () => {
  it('Valid class', () => {
    expect(Frequency).toBeTruthy()
  })
  it('Initialize', () => {
    const frequency = new Frequency()
    expect(frequency.setUnit).toBeTruthy()
  })
  it('Frequency:setUnit and getUnit', () => {
    const frequency = new Frequency()
    // Wrong unit
    expect(() => frequency.setUnit('z' as never)).toThrow(
      `Frequency unit "z" is not supported`
    )
    // Correct units
    for (const unit of FrequencyUnits) {
      frequency.setUnit(unit.toLowerCase() as never)
      expect(frequency.getUnit()).toBe(unit)
    }
  })
})
