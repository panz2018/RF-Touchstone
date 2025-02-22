import {
  abs,
  add,
  arg,
  complex,
  Complex,
  log10,
  index,
  multiply,
  pi,
  pow,
  range,
  subset,
} from 'mathjs'
import type { FrequencyUnit } from './frequency'
import { Frequency } from './frequency'

/**
 * S-parameter format: MA, DB, and RI
 * - RI: real and imaginary, i.e. $A + j \cdot B$
 * - MA: magnitude and angle (in degrees), i.e. $A \cdot e^{j \cdot {\pi \over 180} \cdot B }$
 * - DB: decibels and angle (in degrees), i.e. $10^{A \over 20} \cdot e^{j \cdot {\pi \over 180} \cdot B}$
 */
export const TouchstoneFormats = ['RI', 'MA', 'DB'] as const

/**
 * S-parameter format: MA, DB, and RI
 * - RI: real and imaginary, i.e. $A + j \cdot B$
 * - MA: magnitude and angle (in degrees), i.e. $A \cdot e^{j \cdot {\pi \over 180} \cdot B }$
 * - DB: decibels and angle (in degrees), i.e. $10^{A \over 20} \cdot e^{j \cdot {\pi \over 180} \cdot B}$
 */
export type TouchstoneFormat = (typeof TouchstoneFormats)[number]

/**
 * Type of network parameters
 * - S: Scattering parameters
 * - Y: Admittance parameters
 * - Z: Impedance parameters
 * - H: Hybrid-h parameters
 * - G: Hybrid-g parameters
 */
export const TouchstoneParameters = ['S', 'Y', 'Z', 'G', 'H']

/**
 * Type of network parameters: 'S' | 'Y' | 'Z' | 'G' | 'H'
 * - S: Scattering parameters
 * - Y: Admittance parameters
 * - Z: Impedance parameters
 * - H: Hybrid-h parameters
 * - G: Hybrid-g parameters
 */
export type TouchstoneParameter = (typeof TouchstoneParameters)[number]

/**
 * The reference resistance(s) for the network parameters.
 * The token "R" (case-insensitive) followed by one or more reference resistance values.
 *
 * For Touchstone 1.0, this is a single value for all ports.
 * For Touchstone 1.1, this can be an array of values (one per port)
 */
export type TouchstoneImpedance = number | number[]

/**
 * 3D array to store the network parameter data.
 * - The first dimension is the exits (output) port number
 * - The second dimension is the enters (input) port number
 * - The third dimension is the frequency index
 * For example, data[i][j][k] would be the parameter from j+1 port to i+1 port at frequency index k
 */
export type TouchstoneMatrix = Complex[][][]

/**
 * Touchstone class supports both reading (parsing) and writing (generating) touchstone files.
 * Only version 1.0 and 1.1 are supported
 *
 * ## Overview
 *
 * The **Touchstone file format** (also known as `.snp` files) is an industry-standard ASCII text format used to represent the n-port network parameters of electrical circuits. These files are commonly used in RF and microwave engineering to describe the behavior of devices such as filters, amplifiers, and interconnects.
 *
 * A Touchstone file contains data about network parameters (e.g., S-parameters, Y-parameters, Z-parameters) at specific frequencies.
 *
 * ### Key Features:
 * - **File Extensions**: Traditionally, Touchstone files use extensions like `.s1p`, `.s2p`, `.s3p`, etc., where the number indicates the number of ports. For example, `.s2p` represents a 2-port network.
 * - **Case Insensitivity**: Touchstone files are case-insensitive, meaning keywords and values can be written in uppercase or lowercase.
 * - **Versioning**: **Only version 1.0 and 1.1 are supported in this class**
 *
 * ---
 *
 * ## File Structure
 *
 * A Touchstone file consists of several sections, each serving a specific purpose. Below is a breakdown of the structure:
 *
 * ### 1. Header Section
 *
 * - **Comment Lines**: Lines starting with `!` are treated as comments and ignored during parsing.
 * - **Option Line**: Line starting with `#` defines global settings for the file, such as frequency units, parameter type, and data format. Example:
 *   ```
 *   # GHz S MA R 50
 *   ```
 *   - `GHz`: Frequency unit (can be `Hz`, `kHz`, `MHz`, or `GHz`).
 *   - `S`: Parameter type (`S`, `Y`, `Z`, `H`, or `G`).
 *   - `MA`: Data format (`MA` for magnitude-angle, `DB` for decibel-angle, or `RI` for real-imaginary).
 *   - `R 50`: Reference resistance in ohms (default is 50 ohms if omitted).
 *
 * ### 2. Network Data
 *
 * The core of the file contains the network parameter data, organized by frequency. Each frequency point is followed by its corresponding parameter values.
 *
 * - **Single-Ended Networks**: Data is arranged in a matrix format. For example, a 2-port network might look like this:
 *   ```
 *   <frequency> <N11> <N21> <N12> <N22>
 *   ```
 *
 * ---
 *
 * ## Examples
 *
 * ### Example 1: Simple 1-Port S-Parameter File
 * ```plaintext
 * ! 1-port S-parameter file
 * # MHz S MA R 50
 * 100 0.99 -4
 * 200 0.80 -22
 * 300 0.707 -45
 * ```
 *
 * ---
 *
 * ## References:
 * - {@link https://ibis.org/touchstone_ver2.1/touchstone_ver2_1.pdf Touchstone(R) File Format Specification (Version 2.1)}
 * - {@link https://books.google.com/books/about/S_Parameters_for_Signal_Integrity.html?id=_dLKDwAAQBAJ S-Parameters for Signal Integrity}
 * - {@link https://github.com/scikit-rf/scikit-rf/blob/master/skrf/io/touchstone.py scikit-rf: Open Source RF Engineering}
 * - {@link https://github.com/Nubis-Communications/SignalIntegrity/blob/master/SignalIntegrity/Lib/SParameters/SParameters.py SignalIntegrity: Signal and Power Integrity Tools}
 */
export class Touchstone {
  /**
   * Comments in the file header with "!" symbol at the beginning of each row
   */
  public comments: string[] = []

  /**
   * Touchstone format: MA, DB, and RI
   */
  private _format: TouchstoneFormat | undefined

  /**
   * Set the Touchstone format: MA, DB, RI, or undefined
   * - RI: real and imaginary, i.e. $A + j \cdot B$
   * - MA: magnitude and angle (in degrees), i.e. $A \cdot e^{j \cdot {\pi \over 180} \cdot B }$
   * - DB: decibels and angle (in degrees), i.e. $10^{A \over 20} \cdot e^{j \cdot {\pi \over 180} \cdot B}$
   * @param format
   * @returns
   * @throws Will throw an error if the format is not valid
   */
  set format(format: TouchstoneFormat | undefined | null) {
    if (format === undefined || format === null) {
      this._format = undefined
      return
    }
    if (typeof format !== 'string') {
      throw new Error(`Unknown Touchstone format: ${format}`)
    }
    switch (format.toLowerCase()) {
      case 'ma':
        this._format = 'MA'
        break
      case 'db':
        this._format = 'DB'
        break
      case 'ri':
        this._format = 'RI'
        break
      default:
        throw new Error(`Unknown Touchstone format: ${format}`)
    }
  }

  /**
   * Get the Touchstone format
   * @returns
   */
  get format(): TouchstoneFormat | undefined {
    return this._format
  }

  /**
   * Type of network parameter: 'S' | 'Y' | 'Z' | 'G' | 'H'
   */
  private _parameter: TouchstoneParameter | undefined

  /**
   * Set the type of network parameter
   * - S: Scattering parameters
   * - Y: Admittance parameters
   * - Z: Impedance parameters
   * - H: Hybrid-h parameters
   * - G: Hybrid-g parameters
   * @param parameter
   * @returns
   * @throws Will throw an error if the parameter is not valid
   */
  set parameter(parameter: TouchstoneParameter | undefined | null) {
    if (parameter === undefined || parameter === null) {
      this._parameter = undefined
      return
    }
    if (typeof parameter !== 'string') {
      throw new Error(`Unknown Touchstone paramter: ${parameter}`)
    }
    switch (parameter.toLowerCase()) {
      case 's':
        this._parameter = 'S'
        break
      case 'y':
        this._parameter = 'Y'
        break
      case 'z':
        this._parameter = 'Z'
        break
      case 'g':
        this._parameter = 'G'
        break
      case 'h':
        this._parameter = 'H'
        break
      default:
        throw new Error(`Unknown Touchstone paramter: ${parameter}`)
    }
  }

  /**
   * Get the type of network parameter
   */
  get parameter() {
    return this._parameter
  }

  /**
   * Reference impedance(s) for the network parameters
   */
  private _impedance: TouchstoneImpedance = 50

  /**
   * Set the Touchstone impedance
   * @param impedance
   * @returns
   * @throws Will throw an error if the impedance is not valid
   */
  set impedance(impedance: TouchstoneImpedance) {
    if (typeof impedance === 'number') {
      this._impedance = impedance
      return
    }
    if (!Array.isArray(impedance) || impedance.length === 0) {
      throw new Error(`Unknown Touchstone impedance: ${impedance}`)
    }
    for (const element of impedance) {
      if (typeof element !== 'number') {
        throw new Error(`Unknown Touchstone impedance: ${impedance}`)
      }
    }
    this._impedance = impedance
  }

  /**
   * Get the Touchstone format
   * @returns
   */
  get impedance(): TouchstoneImpedance {
    return this._impedance
  }

  /**
   * The number of ports in the network
   */
  private _nports: number | undefined

  /**
   * Set the ports number
   * @param nports
   * @returns
   * @throws Will throw an error if the number of ports is not valid
   */
  set nports(nports: number | undefined | null) {
    if (nports === undefined || nports === null) {
      this._nports = undefined
      return
    }
    if (typeof nports !== 'number') {
      throw new Error(`Unknown ports number: ${nports}`)
    }
    if (!Number.isInteger(nports)) {
      throw new Error(`Unknown ports number: ${nports}`)
    }
    if (nports < 1) {
      throw new Error(`Unknown ports number: ${nports}`)
    }
    this._nports = nports
  }

  /**
   * Get the ports number
   */
  get nports() {
    return this._nports
  }

  /**
   * Frequency points
   */
  public frequency: Frequency | undefined

  /**
   * 3D array to store the network parameter data
   * - The first dimension is the exits (output) port number
   * - The second dimension is the enters (input) port number
   * - The third dimension is the frequency index
   * For example, data[i][j][k] would be the parameter from j+1 port to i+1 port at frequency index k
   */
  public matrix: TouchstoneMatrix | undefined

  /**
   * Read a Touchstone file and parse the content into the internal data structure
   * @param string
   * @param nports
   * @returns
   * @throws Will throw an error if anything is not valid
   */
  public readContent(string: string, nports: number) {
    // Assign the number of ports
    this.nports = nports
    // Parse lines from the string
    const lines = string
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== '')
    // Parse comments
    this.comments = lines
      .filter((line) => line.startsWith('!'))
      .map((line) => line.slice(1).trim())
    // Initialize frequency
    this.frequency = new Frequency()

    // Parse options
    const options = lines.filter((line) => line.startsWith('#'))
    if (options.length === 0) {
      throw new Error('Unable to find the option line starting with "#"')
    } else if (options.length > 1) {
      throw new Error(
        `Only one option line starting with "#" is supported, but found ${options.length} lines`
      )
    }
    const tokens = options[0].slice(1).trim().split(/\s+/)
    // Frequency unit
    this.frequency.unit = tokens[0] as FrequencyUnit
    // Touchstone parameter
    this.parameter = tokens[1] as TouchstoneParameter
    // Touchstone format
    this.format = tokens[2] as TouchstoneFormat
    // Touchstone impedance
    if (tokens.length >= 4) {
      if (tokens[3].toLowerCase() !== 'r') {
        throw new Error(
          `Uknown Touchstone impedance: ${tokens.slice(3).join(' ')}`
        )
      }
      const array = tokens.slice(4).map((d) => parseFloat(d))
      if (array.length === 0 || array.some(Number.isNaN)) {
        throw new Error(
          `Uknown Touchstone impedance: ${tokens.slice(3).join(' ')}`
        )
      }
      if (array.length === 1) {
        this.impedance = array[0]
      } else if (array.length === this.nports) {
        this.impedance = array
      } else {
        throw new Error(
          `${this.nports}-ports network, but find ${array.length} impedances: [${array}]`
        )
      }
    }

    // Parse frequency data
    const content = lines
      .filter((line) => !line.startsWith('!') && !line.startsWith('#'))
      .map((line) => {
        const index = line.indexOf('!')
        if (index !== -1) {
          // If '!' is found，ignore after '!'
          return line.substring(0, index).trim()
        } else {
          // if '!' is not found, return the original line
          return line.trim()
        }
      })
      .join(' ')
    const data = content.split(/\s+/).map((d) => parseFloat(d))
    // countColumn(Columns count): 1 + 2 * nports^2
    const countColumn = 2 * Math.pow(this.nports, 2) + 1
    if (data.length % countColumn !== 0) {
      throw new Error(
        `Touchstone invalid data number: ${data.length}, which should be multiple of ${countColumn}`
      )
    }
    const points = data.length / countColumn
    // f[n] = TokenList[n * countColumn]
    this.frequency.value = subset(
      data,
      index(multiply(range(0, points), countColumn))
    )

    // Initialize matrix
    this.matrix = new Array(nports)
    for (let outPort = 0; outPort < nports; outPort++) {
      this.matrix[outPort] = new Array(nports)
      for (let inPort = 0; inPort < nports; inPort++) {
        this.matrix[outPort][inPort] = new Array(points)
      }
    }
    // Parse matrix data
    for (let outPort = 0; outPort < nports; outPort++) {
      for (let inPort = 0; inPort < nports; inPort++) {
        // A[outPort][inPort][n] = TokenList[countColumn * n + (outPort * nports + inPort) * 2 + 1]
        const A = subset(
          data,
          index(
            add(
              multiply(range(0, points), countColumn),
              (outPort * nports + inPort) * 2 + 1
            )
          )
        )
        // B[outPort][inPort][n] = TokenList[countColumn * n + (outPort * nports + inPort) * 2 + 2]
        const B = subset(
          data,
          index(
            add(
              multiply(range(0, points), countColumn),
              (outPort * nports + inPort) * 2 + 2
            )
          )
        )
        // Array in matrix
        for (let n = 0; n < points; n++) {
          let value: Complex
          switch (this.format) {
            case 'RI':
              value = complex(A[n], B[n])
              break
            case 'MA':
              value = complex({
                r: A[n],
                phi: (B[n] / 180) * pi,
              })
              break
            case 'DB':
              value = complex({
                r: pow(10, A[n] / 20) as number,
                phi: (B[n] / 180) * pi,
              })
              break
            default:
              throw new Error(`Unknown Touchstone format: ${this.format}`)
          }
          if (nports === 2) {
            this.matrix[inPort][outPort][n] = value
          } else {
            this.matrix[outPort][inPort][n] = value
          }
        }
      }
    }
  }

  /**
   * Writes the current Touchstone data to a text in Touchstone version 1.0 or 1.1 format.
   * @returns The Touchstone file content as a string
   * @throws Will throw an error if anything is not valid
   */
  public writeContent(): string {
    // Check if all required data exists
    if (!this.nports) {
      throw new Error('Number of ports is not defined')
    }
    if (!this.frequency) {
      throw new Error('Touchstone frequency is not defined')
    }
    if (!this.frequency.unit) {
      throw new Error('Touchstone frequency unit is not defined')
    }
    if (this.frequency.value.length === 0) {
      throw new Error('Touchstone frequency value is not defined')
    }
    if (!this.parameter) {
      throw new Error('Touchstone parameter is not defined')
    }
    if (!this.format) {
      throw new Error('Touchstone format is not defined')
    }
    if (!this.matrix) {
      throw new Error('Touchstone matrix is not defined')
    }

    // Calculate points number in the network
    const points = this.frequency.value.length
    // Check the matrix size
    if (this.matrix.length !== this.nports) {
      throw new Error(
        `Touchstone matrix has ${this.matrix.length} rows, but expected ${this.nports}`
      )
    }
    for (let outPort = 0; outPort < this.nports; outPort++) {
      if (this.matrix[outPort].length !== this.nports) {
        throw new Error(
          `Touchstone matrix at row #${outPort} has ${this.matrix[outPort].length} columns, but expected ${this.nports}`
        )
      }
      for (let inPort = 0; inPort < this.nports; inPort++) {
        if (this.matrix[outPort][inPort].length !== points) {
          throw new Error(
            `Touchstone matrix at row #${outPort} column #${inPort} has ${this.matrix[outPort][inPort].length} points, but expected ${points}`
          )
        }
      }
    }

    // Generate Touchstone content lines
    const lines: string[] = []

    // Add comments if they exist
    if (this.comments.length > 0) {
      lines.push(...this.comments.map((comment) => `! ${comment}`))
    }

    // Add option line
    let optionLine = `# ${this.frequency.unit} ${this.parameter} ${this.format}`
    if (Array.isArray(this.impedance)) {
      optionLine += ` R ${this.impedance.join(' ')}`
    } else {
      optionLine += ` R ${this.impedance}`
    }
    lines.push(optionLine)

    // Add network data
    for (let n = 0; n < points; n++) {
      const dataLine: string[] = [this.frequency.value[n].toString()]

      // Add matrix data for this frequency point
      for (let outPort = 0; outPort < this.nports; outPort++) {
        for (let inPort = 0; inPort < this.nports; inPort++) {
          const value =
            this.nports === 2
              ? this.matrix[inPort][outPort][n]
              : this.matrix[outPort][inPort][n]

          let A: number, B: number
          switch (this.format) {
            case 'RI':
              A = value.re
              B = value.im
              break
            case 'MA':
              A = abs(value) as unknown as number
              B = (arg(value) / pi) * 180
              break
            case 'DB':
              A = 20 * log10(abs(value) as unknown as number)
              B = (arg(value) / pi) * 180
              break
            default:
              throw new Error(`Unknown Touchstone format: ${this.format}`)
          }
          dataLine.push(A.toString(), B.toString())
        }
      }
      lines.push(dataLine.join(' '))
    }

    lines.push('')
    return lines.join('\n')
  }
}
