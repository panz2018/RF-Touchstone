import ndarray from '@stdlib/ndarray-ctor'
import Complex64 from '@stdlib/complex-float32'
import { Frequency } from './frequency'

/**
 * Interface for a complex number
 */
export type Complex = typeof Complex64

/**
 * The interface for the 2D matrix of complex numbers
 */
export interface TouchStoneData {
  data: Complex[] // 数据存储为一维复数数组
  shape: [number, number] // 形状为二维数组 (行数, 列数)
  dtype: 'complex64' // 数据类型为 complex64
}

/**
 * Touchstone class is used to read/write a touchstone(R) file.
 *
 * References:
 * - {@link https://ibis.org/touchstone_ver2.1/touchstone_ver2_1.pdf Touchstone(R) File Format Specification (Version 2.1)}
 * - {@link https://books.google.com/books/about/S_Parameters_for_Signal_Integrity.html?id=_dLKDwAAQBAJ S-Parameters for Signal Integrity}
 * - {@link https://github.com/scikit-rf/scikit-rf/blob/master/skrf/io/touchstone.py scikit-rf: Open Source RF Engineering}
 * - {@link https://github.com/Nubis-Communications/SignalIntegrity/blob/master/SignalIntegrity/Lib/SParameters/SParameters.py SignalIntegrity: Signal and Power Integrity Tools}
 */
export class Touchstone {
  /**
   * Comments in the file header with "!" symbol at the beginning of each row
   */
  public comments = ''

  /**
   * S-parameter format: MA, DB, and RI
   * - RI: real and imaginary, i.e. $A + j \cdot B$
   * - MA: magnitude and angle (in degrees), i.e. $A \cdot e^{j \cdot {\pi \over 180} \cdot B }$
   * - DB: decibels and angle (in degrees), i.e. $10^{A \over 20} \cdot e^{j \cdot {\pi \over 180} \cdot B}$
   */
  private format: 'RI' | 'MA' | 'DB' | undefined

  /**
   * Type of network parameters
   * - S: Scattering parameters
   * - Y: Admittance parameters
   * - Z: Impedance parameters
   * - H: Hybrid-h parameters
   * - G: Hybrid-g parameters
   */
  private parameter: 'S' | 'Y' | 'Z' | 'G' | 'H' | undefined

  /**
   * Reference impedance for all ports
   */
  private resistance: number = 50

  /**
   * Frequency points
   */
  private frequency: Frequency | undefined

  /**
   * 2D matrix of complex number in TouchStone file
   */
  private matrix: TouchStoneData | undefined

  public read_text(text: string) {
    console.log(text, ndarray)
    console.log(
      this.comments,
      this.format,
      this.parameter,
      this.resistance,
      this.frequency,
      this.matrix
    )
  }
}
