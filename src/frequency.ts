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
  unit: FrequencyUnit = 'Hz'

  /**
   * Frequency values
   */
  f: FrequencyValue = []
}
