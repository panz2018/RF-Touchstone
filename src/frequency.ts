/**
 * Supported frequency units in the Touchstone specification.
 * Note: THz is not officially supported as a file header unit in Touchstone v1.x/v2.x.
 */
export const FrequencyUnits = ['Hz', 'kHz', 'MHz', 'GHz'] as const

/**
 * Type representing the frequency unit.
 * - Hz: Hertz ($10^0$ Hz)
 * - kHz: Kilohertz ($10^3$ Hz)
 * - MHz: Megahertz ($10^6$ Hz)
 * - GHz: Gigahertz ($10^9$ Hz)
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
 * Represents frequency data and provides utility methods for unit conversion and wavelength calculation.
 *
 * @remarks
 * The `Frequency` class is designed to handle frequency points commonly used in RF, microwave,
 * and high-speed digital engineering. It maintains an internal unit and a set of frequency points,
 * allowing for seamless conversion between different frequency and wavelength units.
 *
 * ##### Key Features:
 * - **Unit Awareness**: Keeps track of whether frequencies are defined in Hz, MHz, GHz, etc.
 * - **Automatic Conversion**: Automatically scales frequency points when the `unit` property is changed.
 * - **Wavelength Utilities**: Provides getters and setters for wavelength ($\lambda = c/f$) in various metric units.
 *
 * @example
 * #### Basic Usage
 * ```typescript
 * import { Frequency } from 'rf-touchstone';
 *
 * const freq = new Frequency();
 * freq.unit = 'GHz';
 * freq.f_scaled = [1.0, 2.0, 5.0];
 *
 * console.log(freq.f_Hz); // [1e9, 2e9, 5e9]
 * console.log(freq.wavelength_mm); // [299.79, 149.90, 59.96]
 * ```
 */
export class Frequency {
  /**
   * Internal storage for frequency unit
   * Defaults to 'Hz' as the base SI unit for frequency
   */
  private _unit: FrequencyUnit = 'Hz'

  /**
   * Sets the frequency unit. If frequency points already exist, they will be
   * automatically rescaled to the new unit.
   *
   * @param newUnit - The target frequency unit (Hz, kHz, MHz, or GHz).
   * @throws Error if the provided unit is invalid.
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
    if (parsedUnit !== oldUnit && this.f_scaled && this.f_scaled.length > 0) {
      const oldMultiplier = FREQUENCY_MULTIPLIERS[oldUnit]
      const newMultiplier = FREQUENCY_MULTIPLIERS[parsedUnit]

      /* v8 ignore start */
      if (oldMultiplier && newMultiplier) {
        // Ensure multipliers are found
        this.f_scaled = this.f_scaled.map(
          (freq) => (freq * oldMultiplier) / newMultiplier
        )
      } else {
        // This case should ideally not happen if units are validated correctly
        throw new Error(
          `Could not find frequency multipliers (old: ${oldMultiplier}, new: ${newMultiplier}) for unit conversion`
        )
      }
      /* v8 ignore stop */
    }

    this._unit = parsedUnit // Update the internal unit
  }

  /**
   * Gets the current frequency unit.
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
   * Sets the array of frequency points in the current frequency unit.
   *
   * @param value - Array of numerical frequency points.
   * @throws Error if the input is not a non-negative number array.
   */
  set f_scaled(value: number[]) {
    // Validate input is an array
    if (!Array.isArray(value)) {
      throw new Error('Frequency value must be an array')
    }
    // Validate all elements are numbers and non-negative
    for (const val of value) {
      if (typeof val !== 'number') {
        throw new Error(
          `Frequency value must be an array of numbers, but received: ${val}`
        )
      }
      if (val < 0) {
        throw new Error(
          `Frequency values cannot be negative, but received: ${val}`
        )
      }
    }

    // Store the validated frequency points
    this._f_scaled = value
  }

  /**
   * Gets the array of frequency points in the current unit.
   */
  get f_scaled(): number[] {
    return this._f_scaled
  }

  /**
   * Private helper method to get frequency values in a target unit.
   * @param targetUnit - The key of the target frequency unit in FREQUENCY_MULTIPLIERS.
   * @returns Array of frequency points in the target unit.
   */
  private _getFrequencyInTargetUnit(
    targetUnit: keyof typeof FREQUENCY_MULTIPLIERS
  ): number[] {
    if (!this.f_scaled || this.f_scaled.length === 0) {
      return []
    }

    const currentUnitMultiplier = FREQUENCY_MULTIPLIERS[this.unit]
    /* v8 ignore start */
    if (!currentUnitMultiplier) {
      throw new Error(`Multiplier for current unit ${this.unit} not found.`)
    }
    /* v8 ignore stop */

    const targetMultiplier = FREQUENCY_MULTIPLIERS[targetUnit]
    /* v8 ignore start */
    if (!targetMultiplier) {
      throw new Error(`Multiplier for target unit ${targetUnit} not found.`)
    }
    /* v8 ignore stop */

    return this.f_scaled.map(
      (val) => (val * currentUnitMultiplier) / targetMultiplier
    )
  }

  /**
   * Internal helper to set frequency values from a source unit.
   * @param values - Array of frequency points.
   * @param sourceUnit - The source frequency unit key.
   */
  private _setFrequencyFromTargetUnit(
    values: number[],
    sourceUnit: keyof typeof FREQUENCY_MULTIPLIERS
  ): void {
    /* v8 ignore start */
    if (!values) {
      // Handle null or undefined input array
      this.f_scaled = []
      return
    }
    /* v8 ignore stop */
    if (values.length === 0) {
      /* v8 ignore start */
      this.f_scaled = []
      return
    }
    /* v8 ignore stop */

    const sourceMultiplier = FREQUENCY_MULTIPLIERS[sourceUnit]
    /* v8 ignore start */
    if (!sourceMultiplier) {
      throw new Error(`Multiplier for source unit ${sourceUnit} not found.`)
    }
    /* v8 ignore stop */

    const currentFreqMultiplier = FREQUENCY_MULTIPLIERS[this.unit]
    /* v8 ignore start */
    if (!currentFreqMultiplier) {
      throw new Error(
        `Multiplier for current internal unit ${this.unit} not found.`
      )
    }
    /* v8 ignore stop */

    const convertedValues = values.map(
      (val) => (val * sourceMultiplier) / currentFreqMultiplier
    )
    this.f_scaled = convertedValues
  }

  /**
   * Gets the frequency points in Hertz (Hz).
   */
  get f_Hz(): number[] {
    return this._getFrequencyInTargetUnit('Hz')
  }

  /**
   * Sets the frequency points in Hertz (Hz).
   */
  set f_Hz(values: number[]) {
    this._setFrequencyFromTargetUnit(values, 'Hz')
  }

  /**
   * Gets the frequency points in Kilohertz (kHz).
   */
  get f_kHz(): number[] {
    return this._getFrequencyInTargetUnit('kHz')
  }

  /**
   * Sets the frequency points in Kilohertz (kHz).
   */
  set f_kHz(values: number[]) {
    this._setFrequencyFromTargetUnit(values, 'kHz')
  }

  /**
   * Gets the frequency points in Megahertz (MHz).
   */
  get f_MHz(): number[] {
    return this._getFrequencyInTargetUnit('MHz')
  }

  /**
   * Sets the frequency points in Megahertz (MHz).
   */
  set f_MHz(values: number[]) {
    this._setFrequencyFromTargetUnit(values, 'MHz')
  }

  /**
   * Gets the frequency points in Gigahertz (GHz).
   */
  get f_GHz(): number[] {
    return this._getFrequencyInTargetUnit('GHz')
  }

  /**
   * Sets the frequency points in Gigahertz (GHz).
   */
  set f_GHz(values: number[]) {
    this._setFrequencyFromTargetUnit(values, 'GHz')
  }

  /**
   * Gets the frequency points in Terahertz (THz).
   */
  get f_THz(): number[] {
    return this._getFrequencyInTargetUnit('THz')
  }

  /**
   * Sets the frequency points in Terahertz (THz).
   */
  set f_THz(values: number[]) {
    this._setFrequencyFromTargetUnit(values, 'THz')
  }

  /**
   * Private helper method to get wavelength values in a target unit.
   * @param targetWavelengthUnit - The key of the target wavelength unit in WAVELENGTH_MULTIPLIERS_TO_M.
   * @returns Array of wavelength points in the target unit.
   */
  private _getWavelengthInTargetUnit(
    targetWavelengthUnit: keyof typeof WAVELENGTH_MULTIPLIERS_TO_M
  ): number[] {
    if (!this.f_scaled || this.f_scaled.length === 0) {
      return []
    }

    const currentFreqUnitMultiplier = FREQUENCY_MULTIPLIERS[this.unit]
    /* v8 ignore start */
    if (!currentFreqUnitMultiplier) {
      throw new Error(
        `Frequency multiplier for current unit ${this.unit} not found.`
      )
    }
    /* v8 ignore stop */

    const targetWavelengthToMMultiplier =
      WAVELENGTH_MULTIPLIERS_TO_M[targetWavelengthUnit]
    /* v8 ignore start */
    if (!targetWavelengthToMMultiplier) {
      throw new Error(
        `Wavelength multiplier to meters for target wavelength unit ${targetWavelengthUnit} not found.`
      )
    }
    /* v8 ignore stop */

    return this.f_scaled.map((val) => {
      const freqInHz = val * currentFreqUnitMultiplier
      if (freqInHz === 0) {
        return Infinity
      }
      const wavelengthInMeters = SPEED_OF_LIGHT / freqInHz
      return wavelengthInMeters / targetWavelengthToMMultiplier
    })
  }

  /**
   * Private helper method to set frequency values from wavelength values in a source unit.
   * @param values - Array of wavelength points in the source unit.
   * @param sourceWavelengthUnit - The key of the source wavelength unit in WAVELENGTH_MULTIPLIERS_TO_M.
   */
  private _setWavelengthFromTargetUnit(
    values: number[],
    sourceWavelengthUnit: keyof typeof WAVELENGTH_MULTIPLIERS_TO_M
  ): void {
    /* v8 ignore start */
    if (!values) {
      // Handle null or undefined input array
      this.f_scaled = []
      return
    }
    /* v8 ignore stop */
    if (values.length === 0) {
      this.f_scaled = []
      return
    }

    const sourceWavelengthToMMultiplier =
      WAVELENGTH_MULTIPLIERS_TO_M[sourceWavelengthUnit]
    /* v8 ignore start */
    if (!sourceWavelengthToMMultiplier) {
      throw new Error(
        `Wavelength multiplier to meters for source unit ${sourceWavelengthUnit} not found.`
      )
    }
    /* v8 ignore stop */

    const currentFreqUnitMultiplier = FREQUENCY_MULTIPLIERS[this.unit]
    /* v8 ignore start */
    if (!currentFreqUnitMultiplier) {
      throw new Error(
        `Frequency multiplier for current unit ${this.unit} not found.`
      )
    }
    /* v8 ignore stop */

    const convertedFrequencies = values.map((val) => {
      const wavelengthInMeters = val * sourceWavelengthToMMultiplier
      if (wavelengthInMeters === 0) {
        throw new Error('Cannot convert zero wavelength to frequency.')
      }
      const freqInHz = SPEED_OF_LIGHT / wavelengthInMeters
      return freqInHz / currentFreqUnitMultiplier
    })

    this.f_scaled = convertedFrequencies
  }

  /**
   * Gets the wavelength in meters (m).
   */
  get wavelength_m(): number[] {
    return this._getWavelengthInTargetUnit('m')
  }

  /**
   * Sets the wavelength in meters (m).
   * Note: Changing wavelengths will update the underlying frequency points.
   */
  set wavelength_m(values: number[]) {
    this._setWavelengthFromTargetUnit(values, 'm')
  }

  /**
   * Gets the wavelength in centimeters (cm).
   */
  get wavelength_cm(): number[] {
    return this._getWavelengthInTargetUnit('cm')
  }

  /**
   * Sets the wavelength in centimeters (cm).
   */
  set wavelength_cm(values: number[]) {
    this._setWavelengthFromTargetUnit(values, 'cm')
  }

  /**
   * Gets the wavelength in millimeters (mm).
   */
  get wavelength_mm(): number[] {
    return this._getWavelengthInTargetUnit('mm')
  }

  /**
   * Sets the wavelength in millimeters (mm).
   */
  set wavelength_mm(values: number[]) {
    this._setWavelengthFromTargetUnit(values, 'mm')
  }

  /**
   * Gets the wavelength in micrometers (μm).
   */
  get wavelength_um(): number[] {
    return this._getWavelengthInTargetUnit('um')
  }

  /**
   * Sets the wavelength in micrometers (μm).
   */
  set wavelength_um(values: number[]) {
    this._setWavelengthFromTargetUnit(values, 'um')
  }

  /**
   * Gets the wavelength in nanometers (nm).
   */
  get wavelength_nm(): number[] {
    return this._getWavelengthInTargetUnit('nm')
  }

  /**
   * Sets the wavelength in nanometers (nm).
   */
  set wavelength_nm(values: number[]) {
    this._setWavelengthFromTargetUnit(values, 'nm')
  }
}
