/**
 * Frequency units: 'Hz', 'kHz', 'MHz', 'GHz'
 */
export const FrequencyUnits = ['Hz', 'kHz', 'MHz', 'GHz'] as const

/**
 * Type definition for frequency units
 * - Hz: Hertz (cycles per second)
 * - kHz: Kilohertz (10³ Hz)
 * - MHz: Megahertz (10⁶ Hz)
 * - GHz: Gigahertz (10⁹ Hz)
 */
export type FrequencyUnit = (typeof FrequencyUnits)[number]

/**
 * Speed of light in m/s
 */
export const SPEED_OF_LIGHT = 299792458

/**
 * Multipliers for converting from any FrequencyUnit or THz to Hz
 */
export const FREQUENCY_MULTIPLIERS: Record<FrequencyUnit | 'THz', number> = {
  Hz: 1,
  kHz: 1e3,
  MHz: 1e6,
  GHz: 1e9,
  THz: 1e12,
}

/**
 * Multipliers for converting from other wavelength units to meters
 */
export const WAVELENGTH_MULTIPLIERS_TO_M: Record<string, number> = {
  m: 1,
  cm: 1e-2,
  mm: 1e-3,
  um: 1e-6,
  nm: 1e-9,
}

/**
 * Class representing frequency data in RF and microwave engineering
 *
 * @remarks
 * The Frequency class manages frequency-related data, including:
 * - Frequency unit management
 * - Storage of frequency points
 * - Unit conversion capabilities
 *
 * @example
 * ```typescript
 * const freq = new Frequency();
 * freq.unit = 'GHz';
 * freq.value = [1.0, 2.0, 3.0];
 * ```
 *
 * References:
 * - {@link https://github.com/scikit-rf/scikit-rf/blob/master/skrf/frequency.py scikit-rf: Open Source RF Engineering}
 */
export class Frequency {
  /**
   * Internal storage for frequency unit
   * Defaults to 'Hz' as the base SI unit for frequency
   */
  private _unit: FrequencyUnit = 'Hz'

  /**
   * Sets the frequency unit for the instance
   *
   * @param unit - The frequency unit to set
   * @throws {Error} If the provided unit is not one of the supported frequency units
   *
   * @example
   * ```typescript
   * const freq = new Frequency();
   * freq.unit = 'MHz'; // Sets unit to Megahertz
   * ```
   */
  set unit(newUnit: FrequencyUnit) {
    if (typeof newUnit !== 'string') {
      throw new Error(`Unknown frequency unit: ${newUnit}`)
    }

    const oldUnit = this._unit // Store the old unit

    // Validate and parse the new unit
    let parsedUnit: FrequencyUnit
    switch (newUnit.toLowerCase()) {
      case 'hz':
        parsedUnit = 'Hz'
        break
      case 'khz':
        parsedUnit = 'kHz'
        break
      case 'mhz':
        parsedUnit = 'MHz'
        break
      case 'ghz':
        parsedUnit = 'GHz'
        break
      default:
        throw new Error(`Unknown frequency unit: ${newUnit}`)
    }

    // If the unit is actually changing and f_scaled is populated
    if (parsedUnit !== oldUnit && this._f_scaled && this._f_scaled.length > 0) {
      const oldMultiplier = FREQUENCY_MULTIPLIERS[oldUnit]
      const newMultiplier = FREQUENCY_MULTIPLIERS[parsedUnit]

      if (oldMultiplier && newMultiplier) {
        // Ensure multipliers are found
        this._f_scaled = this._f_scaled.map((freq) => (freq * oldMultiplier) / newMultiplier)
      } else {
        // This case should ideally not happen if units are validated correctly
        throw new Error('Could not find frequency multipliers for unit conversion.')
      }
    }

    this._unit = parsedUnit // Update the internal unit
  }

  /**
   * Gets the current frequency unit
   *
   * @returns The current frequency unit
   *
   * @example
   * ```typescript
   * const freq = new Frequency();
   * console.log(freq.unit); // Outputs: 'Hz'
   * ```
   */
  get unit(): FrequencyUnit {
    return this._unit
  }

  /**
   * Internal storage for frequency points array
   * Each element represents a frequency point in the specified unit
   * @private
   */
  private _f_scaled: number[] = []

  /**
   * Array of frequency points in the current frequency unit
   * Each element represents a discrete frequency point for measurement or analysis
   *
   * @param value - Array of frequency points
   * @throws {Error} If the input is not an array
   * @throws {Error} If any element in the array is not a number
   * @throws {Error} If the array contains negative frequencies
   *
   * @example
   * ```typescript
   * const freq = new Frequency();
   * freq.unit = 'GHz';
   * freq.value = [1.0, 1.5, 2.0]; // Three frequency points: 1 GHz, 1.5 GHz, and 2 GHz
   * ```
   */
  set f_scaled(value: number[]) {
    // Validate input is an array
    if (!Array.isArray(value)) {
      throw new Error('Frequency value must be an array')
    }
    // Validate all elements are numbers and non-negative
    for (const val of value) {
      if (typeof val !== 'number') {
        throw new Error('Frequency value must be an array of numbers')
      }
      if (val < 0) {
        throw new Error('Frequency values cannot be negative')
      }
    }

    // Store the validated frequency points
    this._f_scaled = value
  }

  /**
   * Gets the array of frequency points
   * @returns Array of frequency points in the current unit
   */
  get f_scaled(): number[] {
    return this._f_scaled
  }

  /**
   * Gets frequency points in Hz
   * @returns Array of frequency points in Hz
   */
  get f_Hz(): number[] {
    const currentUnitMultiplier = FREQUENCY_MULTIPLIERS[this.unit]
    if (!currentUnitMultiplier) {
      throw new Error(`Multiplier for unit ${this.unit} not found.`)
    }
    // FREQUENCY_MULTIPLIERS['Hz'] is 1
    return this.f_scaled.map((val) => val * currentUnitMultiplier)
  }

  /**
   * Sets frequency points assuming input is in Hz
   * @param values - Array of frequency points in Hz
   */
  set f_Hz(values: number[]) {
    const targetUnitMultiplier = FREQUENCY_MULTIPLIERS[this.unit]
    if (!targetUnitMultiplier) {
      throw new Error(`Multiplier for unit ${this.unit} not found.`)
    }
    // values are already in Hz, so no initial conversion to Hz needed
    this.f_scaled = values.map((valInHz) => valInHz / targetUnitMultiplier)
  }

  /**
   * Gets frequency points in kHz
   * @returns Array of frequency points in kHz
   */
  get f_kHz(): number[] {
    const currentUnitMultiplier = FREQUENCY_MULTIPLIERS[this.unit]
    const kHzMultiplier = FREQUENCY_MULTIPLIERS['kHz']
    if (!currentUnitMultiplier || !kHzMultiplier) {
      throw new Error(`Multipliers for unit ${this.unit} or kHz not found.`)
    }
    return this.f_scaled.map((val) => (val * currentUnitMultiplier) / kHzMultiplier)
  }

  /**
   * Sets frequency points assuming input is in kHz
   * @param values - Array of frequency points in kHz
   */
  set f_kHz(values: number[]) {
    const kHzMultiplier = FREQUENCY_MULTIPLIERS['kHz']
    const targetUnitMultiplier = FREQUENCY_MULTIPLIERS[this.unit]

    if (!kHzMultiplier || !targetUnitMultiplier) {
      throw new Error(`Multipliers for kHz or unit ${this.unit} not found.`)
    }

    const valuesInHz = values.map((val) => val * kHzMultiplier)
    this.f_scaled = valuesInHz.map((valInHz) => valInHz / targetUnitMultiplier)
  }

  /**
   * Gets frequency points in MHz
   * @returns Array of frequency points in MHz
   */
  get f_MHz(): number[] {
    const currentUnitMultiplier = FREQUENCY_MULTIPLIERS[this.unit]
    const mhzMultiplier = FREQUENCY_MULTIPLIERS['MHz']
    if (!currentUnitMultiplier || !mhzMultiplier) {
      throw new Error(`Multipliers for unit ${this.unit} or MHz not found.`)
    }
    return this.f_scaled.map((val) => (val * currentUnitMultiplier) / mhzMultiplier)
  }

  /**
   * Sets frequency points assuming input is in MHz
   * @param values - Array of frequency points in MHz
   */
  set f_MHz(values: number[]) {
    const mhzMultiplier = FREQUENCY_MULTIPLIERS['MHz']
    const targetUnitMultiplier = FREQUENCY_MULTIPLIERS[this.unit]

    if (!mhzMultiplier || !targetUnitMultiplier) {
      throw new Error(`Multipliers for MHz or unit ${this.unit} not found.`)
    }

    const valuesInHz = values.map((val) => val * mhzMultiplier)
    this.f_scaled = valuesInHz.map((valInHz) => valInHz / targetUnitMultiplier)
  }

  /**
   * Gets frequency points in GHz
   * @returns Array of frequency points in GHz
   */
  get f_GHz(): number[] {
    const currentUnitMultiplier = FREQUENCY_MULTIPLIERS[this.unit]
    const ghzMultiplier = FREQUENCY_MULTIPLIERS['GHz']
    if (!currentUnitMultiplier || !ghzMultiplier) {
      throw new Error(`Multipliers for unit ${this.unit} or GHz not found.`)
    }
    return this.f_scaled.map((val) => (val * currentUnitMultiplier) / ghzMultiplier)
  }

  /**
   * Sets frequency points assuming input is in GHz
   * @param values - Array of frequency points in GHz
   */
  set f_GHz(values: number[]) {
    const ghzMultiplier = FREQUENCY_MULTIPLIERS['GHz']
    const targetUnitMultiplier = FREQUENCY_MULTIPLIERS[this.unit]

    if (!ghzMultiplier || !targetUnitMultiplier) {
      throw new Error(`Multipliers for GHz or unit ${this.unit} not found.`)
    }

    const valuesInHz = values.map((val) => val * ghzMultiplier)
    this.f_scaled = valuesInHz.map((valInHz) => valInHz / targetUnitMultiplier)
  }

  /**
   * Gets frequency points in THz
   * @returns Array of frequency points in THz
   */
  get f_THz(): number[] {
    const currentUnitMultiplier = FREQUENCY_MULTIPLIERS[this.unit]
    const thzActualMultiplier = FREQUENCY_MULTIPLIERS['THz']
    if (!currentUnitMultiplier || !thzActualMultiplier) {
      throw new Error(`Multipliers for unit ${this.unit} or THz not found.`)
    }
    return this.f_scaled.map((val) => (val * currentUnitMultiplier) / thzActualMultiplier)
  }

  /**
   * Sets frequency points assuming input is in THz
   * @param values - Array of frequency points in THz
   */
  set f_THz(values: number[]) {
    const targetUnitMultiplier = FREQUENCY_MULTIPLIERS[this.unit]
    const thzActualMultiplier = FREQUENCY_MULTIPLIERS['THz']

    if (!thzActualMultiplier || !targetUnitMultiplier) {
      throw new Error(`Multipliers for THz or unit ${this.unit} not found.`)
    }

    const valuesInHz = values.map((val) => val * thzActualMultiplier)
    this.f_scaled = valuesInHz.map((valInHz) => valInHz / targetUnitMultiplier)
  }

  /**
   * Gets wavelength in meters
   * @returns Array of wavelength values in meters
   */
  get wavelength_m(): number[] {
    const currentFreqUnitMultiplier = FREQUENCY_MULTIPLIERS[this.unit]
    if (!currentFreqUnitMultiplier) {
      throw new Error(`Frequency multiplier for unit ${this.unit} not found.`)
    }
    const wavelengthUnitMultiplierToM = WAVELENGTH_MULTIPLIERS_TO_M['m']
    if (!wavelengthUnitMultiplierToM) {
      throw new Error(`Wavelength unit multiplier to 'm' for 'm' not found.`)
    }

    return this.f_scaled.map((f) => {
      const freqHz = f * currentFreqUnitMultiplier
      if (freqHz === 0) return Infinity
      const wavelengthM = SPEED_OF_LIGHT / freqHz
      return wavelengthM / wavelengthUnitMultiplierToM // wavelengthM / 1
    })
  }

  /**
   * Sets wavelength in meters. Converts to frequency and stores.
   * @param values - Array of wavelength values in meters
   */
  set wavelength_m(wavelengthValues: number[]) {
    const targetFreqUnitMultiplier = FREQUENCY_MULTIPLIERS[this.unit]
    if (!targetFreqUnitMultiplier) {
      throw new Error(`Frequency multiplier for unit ${this.unit} not found.`)
    }
    const wavelengthMultiplierToM = WAVELENGTH_MULTIPLIERS_TO_M['m']
    if (!wavelengthMultiplierToM) {
      throw new Error(`Wavelength multiplier to 'm' not found.`)
    }

    const freqsInTargetUnit = wavelengthValues.map((wl) => {
      const wavelengthM = wl * wavelengthMultiplierToM // Multiplier is 1
      if (wavelengthM === 0) {
        // This would result in Infinity for freqHz.
        // The f_scaled setter will handle Infinity if it's not a valid number type.
        // Or, throw a specific error here if 0 wavelength is disallowed.
        throw new Error('Wavelength cannot be zero.')
      }
      const freqHz = SPEED_OF_LIGHT / wavelengthM
      return freqHz / targetFreqUnitMultiplier
    })
    this.f_scaled = freqsInTargetUnit
  }

  /**
   * Gets wavelength in centimeters
   * @returns Array of wavelength values in centimeters
   */
  get wavelength_cm(): number[] {
    const currentFreqUnitMultiplier = FREQUENCY_MULTIPLIERS[this.unit]
    if (!currentFreqUnitMultiplier) {
      throw new Error(`Frequency multiplier for unit ${this.unit} not found.`)
    }
    const wavelengthUnitMultiplierToM = WAVELENGTH_MULTIPLIERS_TO_M['cm']
    if (!wavelengthUnitMultiplierToM) {
      throw new Error(`Wavelength unit multiplier to 'm' for 'cm' not found.`)
    }

    return this.f_scaled.map((f) => {
      const freqHz = f * currentFreqUnitMultiplier
      if (freqHz === 0) return Infinity
      const wavelengthM = SPEED_OF_LIGHT / freqHz
      return wavelengthM / wavelengthUnitMultiplierToM
    })
  }

  /**
   * Sets wavelength in centimeters. Converts to frequency and stores.
   * @param values - Array of wavelength values in centimeters
   */
  set wavelength_cm(wavelengthValues: number[]) {
    const targetFreqUnitMultiplier = FREQUENCY_MULTIPLIERS[this.unit]
    if (!targetFreqUnitMultiplier) {
      throw new Error(`Frequency multiplier for unit ${this.unit} not found.`)
    }
    const wavelengthMultiplierToM = WAVELENGTH_MULTIPLIERS_TO_M['cm']
    if (!wavelengthMultiplierToM) {
      throw new Error(`Wavelength multiplier to 'm' for 'cm' not found.`)
    }

    const freqsInTargetUnit = wavelengthValues.map((wl) => {
      const wavelengthM = wl * wavelengthMultiplierToM
      if (wavelengthM === 0) {
        throw new Error('Wavelength cannot be zero.')
      }
      const freqHz = SPEED_OF_LIGHT / wavelengthM
      return freqHz / targetFreqUnitMultiplier
    })
    this.f_scaled = freqsInTargetUnit
  }

  /**
   * Gets wavelength in millimeters
   * @returns Array of wavelength values in millimeters
   */
  get wavelength_mm(): number[] {
    const currentFreqUnitMultiplier = FREQUENCY_MULTIPLIERS[this.unit]
    if (!currentFreqUnitMultiplier) {
      throw new Error(`Frequency multiplier for unit ${this.unit} not found.`)
    }
    const wavelengthUnitMultiplierToM = WAVELENGTH_MULTIPLIERS_TO_M['mm']
    if (!wavelengthUnitMultiplierToM) {
      throw new Error(`Wavelength unit multiplier to 'm' for 'mm' not found.`)
    }

    return this.f_scaled.map((f) => {
      const freqHz = f * currentFreqUnitMultiplier
      if (freqHz === 0) return Infinity
      const wavelengthM = SPEED_OF_LIGHT / freqHz
      return wavelengthM / wavelengthUnitMultiplierToM
    })
  }

  /**
   * Sets wavelength in millimeters. Converts to frequency and stores.
   * @param values - Array of wavelength values in millimeters
   */
  set wavelength_mm(wavelengthValues: number[]) {
    const targetFreqUnitMultiplier = FREQUENCY_MULTIPLIERS[this.unit]
    if (!targetFreqUnitMultiplier) {
      throw new Error(`Frequency multiplier for unit ${this.unit} not found.`)
    }
    const wavelengthMultiplierToM = WAVELENGTH_MULTIPLIERS_TO_M['mm']
    if (!wavelengthMultiplierToM) {
      throw new Error(`Wavelength multiplier to 'm' for 'mm' not found.`)
    }

    const freqsInTargetUnit = wavelengthValues.map((wl) => {
      const wavelengthM = wl * wavelengthMultiplierToM
      if (wavelengthM === 0) {
        throw new Error('Cannot convert zero wavelength to frequency.')
      }
      const freqHz = SPEED_OF_LIGHT / wavelengthM
      return freqHz / targetFreqUnitMultiplier
    })
    this.f_scaled = freqsInTargetUnit
  }

  /**
   * Gets wavelength in micrometers
   * @returns Array of wavelength values in micrometers
   */
  get wavelength_um(): number[] {
    const currentFreqUnitMultiplier = FREQUENCY_MULTIPLIERS[this.unit]
    if (!currentFreqUnitMultiplier) {
      throw new Error(`Frequency multiplier for unit ${this.unit} not found.`)
    }
    const wavelengthUnitMultiplierToM = WAVELENGTH_MULTIPLIERS_TO_M['um']
    if (!wavelengthUnitMultiplierToM) {
      throw new Error(`Wavelength unit multiplier to 'm' for 'um' not found.`)
    }

    return this.f_scaled.map((f) => {
      const freqHz = f * currentFreqUnitMultiplier
      if (freqHz === 0) return Infinity
      const wavelengthM = SPEED_OF_LIGHT / freqHz
      return wavelengthM / wavelengthUnitMultiplierToM
    })
  }

  /**
   * Sets wavelength in micrometers. Converts to frequency and stores.
   * @param values - Array of wavelength values in micrometers
   */
  set wavelength_um(wavelengthValues: number[]) {
    const targetFreqUnitMultiplier = FREQUENCY_MULTIPLIERS[this.unit]
    if (!targetFreqUnitMultiplier) {
      throw new Error(`Frequency multiplier for unit ${this.unit} not found.`)
    }
    const wavelengthMultiplierToM = WAVELENGTH_MULTIPLIERS_TO_M['um']
    if (!wavelengthMultiplierToM) {
      throw new Error(`Wavelength multiplier to 'm' for 'um' not found.`)
    }

    const freqsInTargetUnit = wavelengthValues.map((wl) => {
      const wavelengthM = wl * wavelengthMultiplierToM
      if (wavelengthM === 0) {
        throw new Error('Cannot convert zero wavelength to frequency.')
      }
      const freqHz = SPEED_OF_LIGHT / wavelengthM
      return freqHz / targetFreqUnitMultiplier
    })
    this.f_scaled = freqsInTargetUnit
  }

  /**
   * Gets wavelength in nanometers
   * @returns Array of wavelength values in nanometers
   */
  get wavelength_nm(): number[] {
    const currentFreqUnitMultiplier = FREQUENCY_MULTIPLIERS[this.unit]
    if (!currentFreqUnitMultiplier) {
      throw new Error(`Frequency multiplier for unit ${this.unit} not found.`)
    }
    const wavelengthUnitMultiplierToM = WAVELENGTH_MULTIPLIERS_TO_M['nm']
    if (!wavelengthUnitMultiplierToM) {
      throw new Error(`Wavelength unit multiplier to 'm' for 'nm' not found.`)
    }

    return this.f_scaled.map((f) => {
      const freqHz = f * currentFreqUnitMultiplier
      if (freqHz === 0) return Infinity
      const wavelengthM = SPEED_OF_LIGHT / freqHz
      return wavelengthM / wavelengthUnitMultiplierToM
    })
  }

  /**
   * Sets wavelength in nanometers. Converts to frequency and stores.
   * @param values - Array of wavelength values in nanometers
   */
  set wavelength_nm(wavelengthValues: number[]) {
    const targetFreqUnitMultiplier = FREQUENCY_MULTIPLIERS[this.unit]
    if (!targetFreqUnitMultiplier) {
      throw new Error(`Frequency multiplier for unit ${this.unit} not found.`)
    }
    const wavelengthMultiplierToM = WAVELENGTH_MULTIPLIERS_TO_M['nm']
    if (!wavelengthMultiplierToM) {
      throw new Error(`Wavelength multiplier to 'm' for 'nm' not found.`)
    }

    const freqsInTargetUnit = wavelengthValues.map((wl) => {
      const wavelengthM = wl * wavelengthMultiplierToM
      if (wavelengthM === 0) {
        throw new Error('Cannot convert zero wavelength to frequency.')
      }
      const freqHz = SPEED_OF_LIGHT / wavelengthM
      return freqHz / targetFreqUnitMultiplier
    })
    this.f_scaled = freqsInTargetUnit
  }
}
