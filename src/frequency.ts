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
   * Private helper method to get frequency values in a target unit.
   * @param targetUnitKey - The key of the target frequency unit in FREQUENCY_MULTIPLIERS.
   * @returns Array of frequency points in the target unit.
   */
  private _getFrequencyInTargetUnit(targetUnitKey: keyof typeof FREQUENCY_MULTIPLIERS): number[] {
    if (!this.f_scaled || this.f_scaled.length === 0) {
      return []
    }

    const currentUnitMultiplier = FREQUENCY_MULTIPLIERS[this.unit]
    if (!currentUnitMultiplier) {
      throw new Error(`Multiplier for current unit ${this.unit} not found.`)
    }

    const targetMultiplier = FREQUENCY_MULTIPLIERS[targetUnitKey]
    if (!targetMultiplier) {
      throw new Error(`Multiplier for target unit ${targetUnitKey} not found.`)
    }

    return this.f_scaled.map((val) => (val * currentUnitMultiplier) / targetMultiplier)
  }

  /**
   * Private helper method to set frequency values from a source unit.
   * @param values - Array of frequency points in the source unit.
   * @param sourceUnitKey - The key of the source frequency unit in FREQUENCY_MULTIPLIERS.
   */
  private _setFrequencyFromTargetUnit(
    values: number[],
    sourceUnitKey: keyof typeof FREQUENCY_MULTIPLIERS,
  ): void {
    if (!values) { // Handle null or undefined input array
        this.f_scaled = []
        return
    }
    if (values.length === 0) {
      this.f_scaled = []
      return
    }

    const sourceMultiplier = FREQUENCY_MULTIPLIERS[sourceUnitKey]
    if (!sourceMultiplier) {
      throw new Error(`Multiplier for source unit ${sourceUnitKey} not found.`)
    }

    const currentInternalUnitMultiplier = FREQUENCY_MULTIPLIERS[this.unit]
    if (!currentInternalUnitMultiplier) {
      throw new Error(`Multiplier for current internal unit ${this.unit} not found.`)
    }

    const convertedValues = values.map(
      (val) => (val * sourceMultiplier) / currentInternalUnitMultiplier,
    )
    this.f_scaled = convertedValues
  }

  /**
   * Private helper method to get wavelength values in a target unit.
   * @param targetWavelengthUnitKey - The key of the target wavelength unit in WAVELENGTH_MULTIPLIERS_TO_M.
   * @returns Array of wavelength points in the target unit.
   */
  private _getWavelengthInTargetUnit(
    targetWavelengthUnitKey: keyof typeof WAVELENGTH_MULTIPLIERS_TO_M,
  ): number[] {
    if (!this.f_scaled || this.f_scaled.length === 0) {
      return []
    }

    const currentFreqUnitMultiplier = FREQUENCY_MULTIPLIERS[this.unit]
    if (!currentFreqUnitMultiplier) {
      throw new Error(`Frequency multiplier for current unit ${this.unit} not found.`)
    }

    const targetWavelengthToMMultiplier = WAVELENGTH_MULTIPLIERS_TO_M[targetWavelengthUnitKey]
    if (!targetWavelengthToMMultiplier) {
      throw new Error(
        `Wavelength multiplier to meters for target unit ${targetWavelengthUnitKey} not found.`,
      )
    }

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
   * @param sourceWavelengthUnitKey - The key of the source wavelength unit in WAVELENGTH_MULTIPLIERS_TO_M.
   */
  private _setWavelengthFromTargetUnit(
    values: number[],
    sourceWavelengthUnitKey: keyof typeof WAVELENGTH_MULTIPLIERS_TO_M,
  ): void {
    if (!values) { // Handle null or undefined input array
      this.f_scaled = []
      return
    }
    if (values.length === 0) {
      this.f_scaled = []
      return
    }

    const sourceWavelengthToMMultiplier = WAVELENGTH_MULTIPLIERS_TO_M[sourceWavelengthUnitKey]
    if (!sourceWavelengthToMMultiplier) {
      throw new Error(
        `Wavelength multiplier to meters for source unit ${sourceWavelengthUnitKey} not found.`,
      )
    }

    const currentFreqUnitMultiplier = FREQUENCY_MULTIPLIERS[this.unit]
    if (!currentFreqUnitMultiplier) {
      throw new Error(`Frequency multiplier for current unit ${this.unit} not found.`)
    }

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
   * Gets frequency points in Hz
   * @returns Array of frequency points in Hz
   */
  get f_Hz(): number[] {
    return this._getFrequencyInTargetUnit('Hz')
  }

  /**
   * Sets frequency points assuming input is in Hz
   * @param values - Array of frequency points in Hz
   */
  set f_Hz(values: number[]) {
    this._setFrequencyFromTargetUnit(values, 'Hz')
  }

  /**
   * Gets frequency points in kHz
   * @returns Array of frequency points in kHz
   */
  get f_kHz(): number[] {
    return this._getFrequencyInTargetUnit('kHz')
  }

  /**
   * Sets frequency points assuming input is in kHz
   * @param values - Array of frequency points in kHz
   */
  set f_kHz(values: number[]) {
    this._setFrequencyFromTargetUnit(values, 'kHz')
  }

  /**
   * Gets frequency points in MHz
   * @returns Array of frequency points in MHz
   */
  get f_MHz(): number[] {
    return this._getFrequencyInTargetUnit('MHz')
  }

  /**
   * Sets frequency points assuming input is in MHz
   * @param values - Array of frequency points in MHz
   */
  set f_MHz(values: number[]) {
    this._setFrequencyFromTargetUnit(values, 'MHz')
  }

  /**
   * Gets frequency points in GHz
   * @returns Array of frequency points in GHz
   */
  get f_GHz(): number[] {
    return this._getFrequencyInTargetUnit('GHz')
  }

  /**
   * Sets frequency points assuming input is in GHz
   * @param values - Array of frequency points in GHz
   */
  set f_GHz(values: number[]) {
    this._setFrequencyFromTargetUnit(values, 'GHz')
  }

  /**
   * Gets frequency points in THz
   * @returns Array of frequency points in THz
   */
  get f_THz(): number[] {
    return this._getFrequencyInTargetUnit('THz')
  }

  /**
   * Sets frequency points assuming input is in THz
   * @param values - Array of frequency points in THz
   */
  set f_THz(values: number[]) {
    this._setFrequencyFromTargetUnit(values, 'THz')
  }

  /**
   * Gets wavelength in meters
   * @returns Array of wavelength values in meters
   */
  get wavelength_m(): number[] {
    return this._getWavelengthInTargetUnit('m')
  }

  /**
   * Sets wavelength in meters. Converts to frequency and stores.
   * @param values - Array of wavelength values in meters
   */
  set wavelength_m(wavelengthValues: number[]) {
    this._setWavelengthFromTargetUnit(wavelengthValues, 'm')
  }

  /**
   * Gets wavelength in centimeters
   * @returns Array of wavelength values in centimeters
   */
  get wavelength_cm(): number[] {
    return this._getWavelengthInTargetUnit('cm')
  }

  /**
   * Sets wavelength in centimeters. Converts to frequency and stores.
   * @param values - Array of wavelength values in centimeters
   */
  set wavelength_cm(wavelengthValues: number[]) {
    this._setWavelengthFromTargetUnit(wavelengthValues, 'cm')
  }

  /**
   * Gets wavelength in millimeters
   * @returns Array of wavelength values in millimeters
   */
  get wavelength_mm(): number[] {
    return this._getWavelengthInTargetUnit('mm')
  }

  /**
   * Sets wavelength in millimeters. Converts to frequency and stores.
   * @param values - Array of wavelength values in millimeters
   */
  set wavelength_mm(wavelengthValues: number[]) {
    this._setWavelengthFromTargetUnit(wavelengthValues, 'mm')
  }

  /**
   * Gets wavelength in micrometers
   * @returns Array of wavelength values in micrometers
   */
  get wavelength_um(): number[] {
    return this._getWavelengthInTargetUnit('um')
  }

  /**
   * Sets wavelength in micrometers. Converts to frequency and stores.
   * @param values - Array of wavelength values in micrometers
   */
  set wavelength_um(wavelengthValues: number[]) {
    this._setWavelengthFromTargetUnit(wavelengthValues, 'um')
  }

  /**
   * Gets wavelength in nanometers
   * @returns Array of wavelength values in nanometers
   */
  get wavelength_nm(): number[] {
    return this._getWavelengthInTargetUnit('nm')
  }

  /**
   * Sets wavelength in nanometers. Converts to frequency and stores.
   * @param values - Array of wavelength values in nanometers
   */
  set wavelength_nm(wavelengthValues: number[]) {
    this._setWavelengthFromTargetUnit(wavelengthValues, 'nm')
  }
}
