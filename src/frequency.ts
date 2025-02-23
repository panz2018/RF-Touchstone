/**
 * Frequency units: 'Hz', 'kHz', 'MHz', 'GHz', 'THz'
 */
export const FrequencyUnits = ['Hz', 'kHz', 'MHz', 'GHz', 'THz'] as const

/**
 * Type definition for frequency units
 * - Hz: Hertz (cycles per second)
 * - kHz: Kilohertz (10³ Hz)
 * - MHz: Megahertz (10⁶ Hz)
 * - GHz: Gigahertz (10⁹ Hz)
 * - THz: Terahertz (10¹² Hz)
 */
export type FrequencyUnit = (typeof FrequencyUnits)[number]

/**
 * Type definition for frequency values array
 * Each element represents a frequency point in the specified unit
 */
export type FrequencyValue = number[]

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
  set unit(unit: FrequencyUnit) {
    if (typeof unit !== 'string') {
      throw new Error(`Unknown frequency unit: ${unit}`)
    }
    switch (unit.toLowerCase()) {
      case 'hz':
        this._unit = 'Hz'
        break
      case 'khz':
        this._unit = 'kHz'
        break
      case 'mhz':
        this._unit = 'MHz'
        break
      case 'ghz':
        this._unit = 'GHz'
        break
      case 'thz':
        this._unit = 'THz'
        break
      default:
        throw new Error(`Unknown frequency unit: ${unit}`)
    }
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
   * Array of frequency points in the current unit
   * Each element represents a discrete frequency point for measurement or analysis
   *
   * @example
   * ```typescript
   * const freq = new Frequency();
   * freq.unit = 'GHz';
   * freq.value = [1.0, 1.5, 2.0]; // Three frequency points: 1 GHz, 1.5 GHz, and 2 GHz
   * ```
   */
  public value: FrequencyValue = []
}
