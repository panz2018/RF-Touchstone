/** Frequency class is used to store frequency related properties and functions
 *
 * References:
 * - {@link https://github.com/scikit-rf/scikit-rf/blob/master/skrf/frequency.py scikit-rf: Open Source RF Engineering}
 */
export class Frequency {
  /** Frequency unit: 'Hz', 'kHz', 'MHz', 'GHz', 'THz'
   *  Default: 'Hz'
   */
  unit: 'Hz' | 'kHz' | 'MHz' | 'GHz' | 'THz' = 'Hz'
}
