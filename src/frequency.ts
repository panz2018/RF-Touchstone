/**
 * Frequency units: 'Hz', 'kHz', 'MHz', 'GHz', 'THz'
 */
export const FrequencyUnits = ['Hz', 'kHz', 'MHz', 'GHz', 'THz'] as const

/**
 * Frequency unit: 'Hz' | 'kHz' | 'MHz' | 'GHz' | 'THz'
 */
export type FrequencyUnit = (typeof FrequencyUnits)[number]

/**
 * Frequency values
 */
export type FrequencyValue = number[]

/** Frequency class is used to store frequency related properties and functions
 *
 * References:
 * - {@link https://github.com/scikit-rf/scikit-rf/blob/master/skrf/frequency.py scikit-rf: Open Source RF Engineering}
 */
export class Frequency {
  /**
   * Frequency unit: 'Hz', 'kHz', 'MHz', 'GHz', 'THz'
   *  Default: 'Hz'
   */
  private unit: FrequencyUnit = 'Hz'

  /**
   * Frequency values
   */
  public f: FrequencyValue = []

  /**
   * Set the frequency unit
   * @param unit
   * @returns
   * @throws Will throw an error if the frequency unit is not valid
   */
  public setUnit(unit: FrequencyUnit) {
    switch (unit.toLowerCase()) {
      case 'hz':
        this.unit = 'Hz'
        break
      case 'khz':
        this.unit = 'kHz'
        break
      case 'mhz':
        this.unit = 'MHz'
        break
      case 'ghz':
        this.unit = 'GHz'
        break
      case 'thz':
        this.unit = 'THz'
        break
      default:
        throw new Error(`Frequency unit "${unit}" is not supported`)
    }
  }

  /**
   * Get the frequency unit
   * @returns
   */
  public getUnit(): FrequencyUnit {
    return this.unit
  }
}
