// @vitest-environment node
import { describe, it, expect } from 'vitest'
import {
  Frequency,
  FrequencyUnits,
  FREQUENCY_MULTIPLIERS,
  SPEED_OF_LIGHT,
  WAVELENGTH_MULTIPLIERS_TO_M,
} from '@/frequency'
import type { FrequencyUnit } from '@/frequency'

// Helper data for looped tests
const testBaseUnits: (typeof FrequencyUnits)[number][] = [
  'Hz',
  'kHz',
  'MHz',
  'GHz',
]
const freqAccessors: Array<{
  prop: 'f_Hz' | 'f_kHz' | 'f_MHz' | 'f_GHz' | 'f_THz'
  key: keyof typeof FREQUENCY_MULTIPLIERS
  name: string
}> = [
  { prop: 'f_Hz', key: 'Hz', name: 'f_Hz' },
  { prop: 'f_kHz', key: 'kHz', name: 'f_kHz' },
  { prop: 'f_MHz', key: 'MHz', name: 'f_MHz' },
  { prop: 'f_GHz', key: 'GHz', name: 'f_GHz' },
  { prop: 'f_THz', key: 'THz', name: 'f_THz' },
]

describe('frequency.ts', () => {
  it('Valid class', () => {
    expect(Frequency).toBeTruthy()
  })

  it('Frequency:unit', () => {
    const frequency = new Frequency()
    expect(frequency.unit).toBe('Hz') // Default unit

    // Test valid units
    for (const unit of FrequencyUnits) {
      frequency.unit = unit
      expect(frequency.unit).toBe(unit)
    }
    // Test valid units as lower case
    for (const unit of FrequencyUnits) {
      frequency.unit = unit.toLowerCase() as never
      expect(frequency.unit).toBe(unit)
    }
    // Test valid units as upper case
    for (const unit of FrequencyUnits) {
      frequency.unit = unit.toUpperCase() as never
      expect(frequency.unit).toBe(unit)
    }
    // Test lowercase input
    frequency.unit = 'ghz' as FrequencyUnit // casting for test purposes
    expect(frequency.unit).toBe('GHz')

    // Wrong input type
    expect(() => (frequency.unit = 0 as never)).toThrowError(
      /Unknown frequency unit: 0/
    )
    expect(() => (frequency.unit = undefined as never)).toThrowError(
      /Unknown frequency unit: undefined/
    )
    expect(() => (frequency.unit = null as never)).toThrowError(
      /Unknown frequency unit: null/
    )

    // Wrong input value
    expect(() => (frequency.unit = 'z' as never)).toThrowError(
      /Unknown frequency unit: z/
    )
    expect(() => (frequency.unit = '' as never)).toThrowError(
      /Unknown frequency unit: /
    ) // Empty string

    // frequency.f_scaled
    expect(frequency.unit).toBe('GHz')
    expect(frequency.f_scaled).toStrictEqual([])
    expect(() => {
      frequency.f_scaled = 3 as unknown as number[]
    }).toThrow('Frequency value must be an array')
    frequency.f_scaled = [3]
    expect(frequency.f_scaled).toStrictEqual([3])
    frequency.f_scaled = [2, 4, 6]
    expect(frequency.f_scaled).toStrictEqual([2, 4, 6])
    frequency.unit = 'Hz'
    expect(frequency.f_scaled).toStrictEqual([2e9, 4e9, 6e9]) // 2 GHz, 4 GHz, 6 GHz
    frequency.unit = 'kHz'
    expect(frequency.f_scaled).toStrictEqual([2e6, 4e6, 6e6]) // 2 MHz, 4 MHz, 6 MHz
    frequency.unit = 'MHz'
    expect(frequency.f_scaled).toStrictEqual([2e3, 4e3, 6e3]) // 2 kHz, 4 kHz, 6 kHz
    frequency.unit = 'GHz'
    expect(frequency.f_scaled).toStrictEqual([2, 4, 6]) // 2 GHz, 4 GHz, 6 GHz
  })

  it('Frequency:f_scaled', () => {
    const frequency = new Frequency()
    expect(Array.isArray(frequency.f_scaled)).toBe(true) // Default is an empty array
    expect(frequency.f_scaled.length).toBe(0)

    // Valid assignment
    frequency.f_scaled = [1, 2, 3]
    expect(frequency.f_scaled).toStrictEqual([1, 2, 3])

    frequency.f_scaled = [] // Setting back to empty
    expect(frequency.f_scaled).toStrictEqual([])

    // Wrong input type
    expect(() => (frequency.f_scaled = 0 as never)).toThrowError(
      'Frequency value must be an array'
    )
    expect(() => (frequency.f_scaled = 'test' as never)).toThrowError(
      'Frequency value must be an array'
    )

    // Wrong array element type
    expect(
      () => (frequency.f_scaled = ['1', '2', '3'] as never[])
    ).toThrowError('Frequency value must be an array of numbers')

    // Negative values
    expect(() => (frequency.f_scaled = [1, 2, -3])).toThrowError(
      'Frequency values cannot be negative'
    )
  })

  // --- Tests for modified unit setter ---
  it('Unit Setter: f_scaled conversion GHz to MHz', () => {
    const freq = new Frequency()
    freq.unit = 'GHz'
    freq.f_scaled = [1, 2.5] // 1 GHz, 2.5 GHz
    freq.unit = 'MHz' // Convert to MHz
    const expected = [1000, 2500] // 1000 MHz, 2500 MHz
    expect(freq.f_scaled.length).toBe(expected.length)
    freq.f_scaled.forEach((val, i) => {
      expect(val).toBeCloseTo(expected[i], 5)
    })
  })

  it('Unit Setter: f_scaled conversion MHz to kHz', () => {
    const freq = new Frequency()
    freq.unit = 'MHz'
    freq.f_scaled = [0.5, 1.5] // 0.5 MHz, 1.5 MHz
    freq.unit = 'kHz' // Convert to kHz
    const expected = [500, 1500] // 500 kHz, 1500 kHz
    expect(freq.f_scaled.length).toBe(expected.length)
    freq.f_scaled.forEach((val, i) => {
      expect(val).toBeCloseTo(expected[i], 5)
    })
  })

  it('Unit Setter: f_scaled conversion kHz to Hz', () => {
    const freq = new Frequency()
    freq.unit = 'kHz'
    freq.f_scaled = [10, 20] // 10 kHz, 20 kHz
    freq.unit = 'Hz' // Convert to Hz
    const expected = [10000, 20000] // 10000 Hz, 20000 Hz
    expect(freq.f_scaled.length).toBe(expected.length)
    freq.f_scaled.forEach((val, i) => {
      expect(val).toBeCloseTo(expected[i], 5)
    })
  })

  it('Unit Setter: f_scaled conversion Hz to GHz', () => {
    const freq = new Frequency()
    freq.unit = 'Hz'
    freq.f_scaled = [1e9, 2e9] // 1 GHz, 2 GHz in Hz
    freq.unit = 'GHz' // Convert to GHz
    const expected = [1, 2]
    expect(freq.f_scaled.length).toBe(expected.length)
    freq.f_scaled.forEach((val, i) => {
      expect(val).toBeCloseTo(expected[i], 5)
    })
  })

  it('Unit Setter: f_scaled empty, no conversion', () => {
    const freq = new Frequency()
    freq.unit = 'GHz'
    freq.f_scaled = []
    freq.unit = 'MHz'
    expect(freq.f_scaled.length).toBe(0)
  })

  it('Unit Setter: f_scaled populated, set same unit, no conversion', () => {
    const freq = new Frequency()
    freq.unit = 'MHz'
    const initialValues = [100, 200]
    freq.f_scaled = [...initialValues] // Use spread to ensure a new array if modification is in place
    freq.unit = 'MHz' // Set same unit
    expect(freq.f_scaled.length).toBe(initialValues.length)
    freq.f_scaled.forEach((val, i) => {
      expect(val).toBeCloseTo(initialValues[i], 5)
    })
  })

  // --- Tests for Frequency Getters and Setters ---

  freqAccessors.forEach((gs) => {
    testBaseUnits.forEach((unit) => {
      it(`${gs.name} Setter/Getter: Set as ${gs.name}, Get as ${gs.name}, Current unit ${unit}`, () => {
        const freq = new Frequency()
        freq.unit = unit
        const valuesToSet = [10, 20]
        freq[gs.prop] = valuesToSet
        const retrievedValues = freq[gs.prop]
        expect(retrievedValues.length).toBe(valuesToSet.length)
        retrievedValues.forEach((val, i) =>
          expect(val).toBeCloseTo(valuesToSet[i], 5)
        )
      })
    })

    it(`${gs.name} Setter/Getter: empty`, () => {
      const freq = new Frequency()
      freq.unit = 'Hz' // Set a base unit for f_scaled
      freq.f_scaled = [1, 2, 3] // Initial f_scaled values in Hz
      expect(freq.f_scaled).toStrictEqual([1, 2, 3])

      freq[gs.prop] = []
      expect(freq[gs.prop]).toStrictEqual([])
      expect(freq.f_scaled).toStrictEqual([])
    })

    it(`${gs.name} Setter: Overwrite with different length array`, () => {
      const freq = new Frequency()
      freq.unit = 'Hz' // Set a base unit for f_scaled
      freq.f_scaled = [1, 2, 3] // Initial f_scaled values in Hz

      const newValuesToSet = [400, 500] // e.g. if gs.prop is f_kHz, these are 400kHz, 500kHz
      freq[gs.prop] = newValuesToSet

      // 1. Check if the gs.prop getter returns the new values correctly
      const retrievedValues = freq[gs.prop]
      expect(retrievedValues.length).toBe(newValuesToSet.length)
      retrievedValues.forEach((val, i) =>
        expect(val).toBeCloseTo(newValuesToSet[i], 5)
      )

      // 2. Check if f_scaled (which is in Hz) reflects these new values, converted to Hz
      const expectedFScaledInHz = newValuesToSet.map(
        (v) => (v * FREQUENCY_MULTIPLIERS[gs.key]) / FREQUENCY_MULTIPLIERS['Hz']
      )
      expect(freq.f_scaled.length).toBe(expectedFScaledInHz.length)
      freq.f_scaled.forEach((val, i) =>
        expect(val).toBeCloseTo(expectedFScaledInHz[i], 5)
      )
    })

    it(`${gs.name} Setter: Non-negative value check`, () => {
      const freq = new Frequency()
      expect(() => {
        freq[gs.prop] = [-100]
      }).toThrowError('Frequency values cannot be negative')
    })
  })

  // Specific Cross-Unit Tests
  it('Freq Get/Set: Cross-unit f_MHz getter from GHz base', () => {
    const freq = new Frequency()
    freq.unit = 'GHz'
    freq.f_scaled = [1.5, 2.5] // 1.5 GHz, 2.5 GHz
    const mhzValues = freq.f_MHz
    const expectedMHz = [1500, 2500]
    expect(mhzValues.length).toBe(expectedMHz.length)
    mhzValues.forEach((val, i) => expect(val).toBeCloseTo(expectedMHz[i], 5))
  })

  it('Freq Get/Set: Cross-unit f_kHz setter to GHz base', () => {
    const freq = new Frequency()
    freq.unit = 'GHz'
    freq.f_kHz = [500000, 1000000] // These are 0.5 GHz, 1 GHz (expressed in kHz)
    const expectedGHzInFScaled = [0.5, 1]
    expect(freq.f_scaled.length).toBe(expectedGHzInFScaled.length)
    freq.f_scaled.forEach((val, i) =>
      expect(val).toBeCloseTo(expectedGHzInFScaled[i], 5)
    )
  })

  it('Freq Get/Set: Cross-unit f_THz getter from MHz base', () => {
    const freq = new Frequency()
    freq.unit = 'MHz'
    // These values in MHz represent 1 THz and 2 THz
    // 1 THz = 1e12 Hz; 1 MHz = 1e6 Hz. So 1 THz = 1e6 MHz.
    freq.f_scaled = [1e6, 2e6]
    const thzValues = freq.f_THz
    const expectedTHz = [1, 2]
    expect(thzValues.length).toBe(expectedTHz.length)
    thzValues.forEach((val, i) => expect(val).toBeCloseTo(expectedTHz[i], 5))
  })

  it('Freq Get/Set: Cross-unit f_Hz setter to kHz base', () => {
    const freq = new Frequency()
    freq.unit = 'kHz'
    freq.f_Hz = [10000, 20000] // These are 10 kHz, 20 kHz (expressed in Hz)
    const expectedKHzInFScaled = [10, 20]
    expect(freq.f_scaled.length).toBe(expectedKHzInFScaled.length)
    freq.f_scaled.forEach((val, i) =>
      expect(val).toBeCloseTo(expectedKHzInFScaled[i], 5)
    )
  })

  // --- Tests for Wavelength Getters and Setters ---

  const wavelengthAccessors: Array<{
    prop:
      | 'wavelength_m'
      | 'wavelength_cm'
      | 'wavelength_mm'
      | 'wavelength_um'
      | 'wavelength_nm'
    key: keyof typeof WAVELENGTH_MULTIPLIERS_TO_M
    name: string
  }> = [
    { prop: 'wavelength_m', key: 'm', name: 'wavelength_m' },
    { prop: 'wavelength_cm', key: 'cm', name: 'wavelength_cm' },
    { prop: 'wavelength_mm', key: 'mm', name: 'wavelength_mm' },
    { prop: 'wavelength_um', key: 'um', name: 'wavelength_um' },
    { prop: 'wavelength_nm', key: 'nm', name: 'wavelength_nm' },
  ]

  wavelengthAccessors.forEach((wgs) => {
    testBaseUnits.forEach((unit) => {
      it(`${wgs.name} Setter/Getter: Set as ${wgs.name}, Get as ${wgs.name}, Current unit ${unit}`, () => {
        const freq = new Frequency()
        freq.unit = unit
        const valuesToSet = [1, 0.5] // Example wavelength values
        freq[wgs.prop] = valuesToSet
        const retrievedValues = freq[wgs.prop]
        expect(retrievedValues.length).toBe(valuesToSet.length)
        retrievedValues.forEach((val, i) =>
          expect(val).toBeCloseTo(valuesToSet[i], 5)
        )
      })
    })

    it(`${wgs.name} Setter/Getter: empty`, () => {
      const freq = new Frequency()
      freq.unit = 'Hz' // Set a base unit for f_scaled
      freq.f_scaled = [1, 2, 3] // Initial f_scaled values in Hz
      expect(freq.f_scaled).toStrictEqual([1, 2, 3])

      freq[wgs.prop] = []
      expect(freq[wgs.prop]).toStrictEqual([])
      expect(freq.f_scaled).toStrictEqual([])
    })

    it(`${wgs.name} Setter: Overwrite with different length array`, () => {
      const freq = new Frequency()
      freq.unit = 'Hz'
      freq.f_scaled = [100e6, 200e6] // Initial f_scaled in Hz (100MHz, 200MHz)

      const newWavelengthsToSet = [0.5, 0.25] // Example: 0.5m, 0.25m if wgs.prop is wavelength_m
      freq[wgs.prop] = newWavelengthsToSet

      // 1. Check if the wgs.prop getter returns the new wavelengths correctly
      const retrievedWavelengths = freq[wgs.prop]
      expect(retrievedWavelengths.length).toBe(newWavelengthsToSet.length)
      retrievedWavelengths.forEach((val, i) =>
        expect(val).toBeCloseTo(newWavelengthsToSet[i], 5)
      )

      // 2. Check if f_scaled (which is in Hz) reflects these new wavelengths, converted to Hz
      const expectedFScaledInHz = newWavelengthsToSet.map(
        (wl) => SPEED_OF_LIGHT / (wl * WAVELENGTH_MULTIPLIERS_TO_M[wgs.key])
      )
      expect(freq.f_scaled.length).toBe(expectedFScaledInHz.length)
      freq.f_scaled.forEach((val, i) =>
        expect(val).toBeCloseTo(expectedFScaledInHz[i], 0)
      ) // Precision 0 for Hz if large numbers
    })

    it(`${wgs.name} Setter: Zero wavelength throws error`, () => {
      const freq = new Frequency()
      expect(() => {
        freq[wgs.prop] = [0.1, 0, 0.2]
      }).toThrowError('Cannot convert zero wavelength to frequency.')
    })
  })

  // Specific Cross-Type/Unit and Edge Case Tests
  it('Wavelength Get/Set: Cross-type wavelength_m getter from MHz base', () => {
    const freq = new Frequency()
    freq.unit = 'MHz'
    freq.f_scaled = [150, 300] // 150 MHz, 300 MHz
    const expectedWavelengths_m = [
      SPEED_OF_LIGHT / 150e6,
      SPEED_OF_LIGHT / 300e6,
    ]
    const wavelengths = freq.wavelength_m
    expect(wavelengths.length).toBe(expectedWavelengths_m.length)
    wavelengths.forEach((val, i) =>
      expect(val).toBeCloseTo(expectedWavelengths_m[i], 5)
    )
  })

  it('Wavelength Get/Set: Cross-type wavelength_cm setter to MHz base', () => {
    const freq = new Frequency()
    freq.unit = 'MHz'
    // 10 cm = 0.1 m => f = c / 0.1m = 2997.92458 MHz
    // 20 cm = 0.2 m => f = c / 0.2m = 1498.96229 MHz
    freq.wavelength_cm = [10, 20]
    const expectedFreqs_MHz = [
      SPEED_OF_LIGHT /
        (10 * WAVELENGTH_MULTIPLIERS_TO_M['cm']) /
        FREQUENCY_MULTIPLIERS['MHz'],
      SPEED_OF_LIGHT /
        (20 * WAVELENGTH_MULTIPLIERS_TO_M['cm']) /
        FREQUENCY_MULTIPLIERS['MHz'],
    ]
    expect(freq.f_scaled.length).toBe(expectedFreqs_MHz.length)
    freq.f_scaled.forEach((val, i) =>
      expect(val).toBeCloseTo(expectedFreqs_MHz[i], 3)
    )
  })

  it('Wavelength Getter: Zero frequency results in Infinity wavelength', () => {
    const freq = new Frequency()
    freq.unit = 'Hz'
    freq.f_scaled = [0, 100] // 0 Hz, 100 Hz
    const wavelengths = freq.wavelength_m
    expect(wavelengths[0]).toBe(Infinity)
    expect(wavelengths[1]).toBeCloseTo(SPEED_OF_LIGHT / 100, 5)
  })
})
