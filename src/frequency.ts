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
  private _unit: FrequencyUnit = 'Hz'

  /**
   * Set the frequency unit
   * @param
   * @returns
   * @throws Will throw an error if the frequency unit is not valid
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
   * Get the frequency unit
   * @returns
   */
  get unit(): FrequencyUnit {
    return this._unit
  }

  /**
   * Frequency values
   */
  public _freq: FrequencyValue = []
}
